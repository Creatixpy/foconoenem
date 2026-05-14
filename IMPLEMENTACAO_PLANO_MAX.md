# Implementação do Plano Max

Data: 2026-04-23  
Projeto: `foconoenem`  
Ambiente remoto Supabase validado: `wywcpbgipufylnaauewe`

## 1. Diagnóstico inicial

Antes da implementação, o projeto não tinha um sistema de assinatura recorrente. O estado inicial era:

- Stripe estava integrado apenas para doações avulsas em `app/api/doacao/checkout/route.ts` e `app/api/doacao/webhook/route.ts`.
- Não existia tabela de assinaturas nem trilha dedicada de eventos de subscription no banco.
- O dashboard da conta não exibia plano, status, renovação, portal do cliente ou ação de assinatura.
- Os fluxos de IA ativos estavam distribuídos entre Groq e Gemini.
- As rotas que consomem IA com impacto direto no produto eram:
  - `app/api/gerar-tema/route.ts`
  - `app/api/corrigir/route.ts`
  - `app/api/questoes/route.ts`
- O controle premium precisava ficar no backend; antes não havia distinção por assinatura para seleção de provider de IA.

## 2. Arquitetura escolhida

Foi adotada uma separação explícita entre billing, persistência de assinatura e seleção de provider de IA:

- Banco:
  - `subscriptions` guarda o estado atual consolidado da assinatura do usuário.
  - `subscription_events` guarda os eventos recebidos do Stripe para auditoria, idempotência e rastreabilidade.
- Stripe:
  - Checkout do plano Max via `Stripe Checkout Session` em modo `subscription`.
  - Gerenciamento via `Stripe Billing Portal`.
  - Sincronização de estado via webhook em `/api/doacao/webhook`.
- IA:
  - Fluxo padrão continua com Groq.
  - Usuários Max ativos usam NVIDIA via SDK `openai` compatível.
  - A seleção é feita no servidor por `lib/server/ai/provider.ts`.
- UI:
  - O dashboard `/conta` passou a exibir estado da assinatura, CTA de checkout e CTA de gerenciamento.

## 3. Mudanças no banco

### Migration criada

Arquivo:

- `supabase/migrations/20260423100000_add_max_subscription_support.sql`

Principais objetos criados:

- `public.subscriptions`
- `public.subscription_events`

### Schema implementado

`subscriptions`:

- `user_id`
- `plan_code`
- `plan_name`
- `provider`
- `status`
- `stripe_customer_id`
- `stripe_subscription_id`
- `stripe_price_id`
- `latest_checkout_session_id`
- `latest_checkout_expires_at`
- `current_period_start`
- `current_period_end`
- `renews_at`
- `cancel_at_period_end`
- `cancel_at`
- `canceled_at`
- `metadata`
- `created_at`
- `updated_at`

`subscription_events`:

- `subscription_id`
- `user_id`
- `stripe_event_id`
- `event_type`
- `livemode`
- `api_version`
- `stripe_customer_id`
- `stripe_subscription_id`
- `stripe_checkout_session_id`
- `status`
- `error_message`
- `event_created_at`
- `payload`
- `received_at`
- `processed_at`
- `updated_at`

### Regras implementadas

- `subscriptions.user_id` é único.
- `subscriptions.stripe_customer_id` é único.
- `subscriptions.stripe_subscription_id` é único.
- `subscription_events.stripe_event_id` é único.
- Há índices para leitura por status/período, usuário e subscription.
- `updated_at` é mantido por trigger reaproveitando `public.update_updated_at_column()`.
- RLS foi habilitado:
  - usuário autenticado só pode ler sua própria assinatura em `subscriptions`
  - `service_role` tem acesso integral para sincronização e webhook
  - `subscription_events` fica restrita a `service_role`

### Evidência remota

A migration foi aplicada no Supabase remoto e já aparece no histórico:

```json
{"version":"20260423102140","name":"add_max_subscription_support"}
```

O histórico remoto atual também inclui as migrations da auditoria anterior:

- `20260423020826 reconcile_production_schema_and_donations`
- `20260423020900 index_stripe_webhook_client_reference`
- `20260423102140 add_max_subscription_support`

## 4. Mudanças no Stripe

### Novas rotas

- `app/api/assinatura/checkout/route.ts`
- `app/api/assinatura/portal/route.ts`

### Fluxo de assinatura implementado

1. Usuário autenticado chama `POST /api/assinatura/checkout`.
2. Backend valida origem, autenticação, email confirmado e rate limit.
3. Backend verifica se já existe assinatura Max ativa.
4. Backend tenta reaproveitar um checkout ainda aberto salvo em `subscriptions.latest_checkout_session_id`.
5. Backend garante um `stripe_customer_id` coerente com o usuário Supabase.
6. Backend cria uma `Checkout Session` do Stripe com:
   - `mode: 'subscription'`
   - `price: process.env.STRIPE_MAX_PRICE_ID`
   - `client_reference_id = auth.userId`
   - metadata com `plan_code=max` e `supabase_user_id`
7. O checkout pendente é persistido em `subscriptions`.
8. O Stripe envia eventos para `/api/doacao/webhook`.
9. O webhook registra o evento cru em `subscription_events`.
10. O webhook sincroniza o estado consolidado em `subscriptions`.

### Eventos Stripe tratados

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

### Segurança e consistência

- O webhook valida assinatura com `STRIPE_WEBHOOK_SECRET`.
- O evento cru é persistido antes do processamento final.
- A idempotência do webhook é garantida por `subscription_events.stripe_event_id unique`.
- O sistema busca a subscription canônica no Stripe quando necessário para reduzir drift de status.
- O portal do cliente usa `stripe_customer_id` salvo no banco e só é liberado para usuário autenticado dono da assinatura.

## 5. Mudanças na integração NVIDIA

### Novos arquivos

- `lib/server/ai/nvidia.ts`
- `lib/server/ai/provider.ts`

### Implementação

Foi criada uma integração dedicada com a API compatível com OpenAI da NVIDIA:

```ts
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});
```

Modelo usado:

```ts
model: 'minimaxai/minimax-m2.7'
```

### Estratégia de seleção do provider

`lib/server/ai/provider.ts` resolve o runtime do usuário:

- usuário sem Max ativo:
  - continua no fluxo padrão com Groq
- usuário com Max ativo:
  - tenta NVIDIA com `minimaxai/minimax-m2.7`
  - usa fallback Groq server-side se a tentativa NVIDIA falhar ou não retornar conteúdo final

Essa decisão é feita no backend com leitura de `subscriptions` via service role.

### Rotas protegidas por plano no backend

- `app/api/gerar-tema/route.ts`
- `app/api/corrigir/route.ts`
- `app/api/questoes/route.ts`

### Comportamento do plano Max

- temas Max são gerados diretamente com NVIDIA e não entram no cache compartilhado de temas
- textos de apoio gerados para Max não poluem o cache compartilhado
- questões Max são geradas frescas e não são persistidas no pool compartilhado de `generated_questions`
- o frontend recebe apenas informação suficiente para UX, mas a seleção premium acontece no servidor

## 6. Mudanças na UI

Arquivo principal:

- `app/conta/ContaPageClient.tsx`

Mudanças implementadas:

- card do plano Max
- preço `R$ 10,00/mês`
- status atual da assinatura
- indicação de acesso Max liberado ou não
- próxima renovação e fim do período atual
- aviso quando o cancelamento está agendado
- botão `Assinar Max`
- botão `Gerenciar assinatura`
- mensagens de sucesso e erro usando query params de retorno do checkout

Também foi atualizado:

- `app/privacidade/page.tsx`

Motivo:

- refletir o uso da NVIDIA no plano Max e o compartilhamento com esse provedor

## 7. Arquivos criados

- `app/api/assinatura/checkout/route.ts`
- `app/api/assinatura/portal/route.ts`
- `lib/constants/subscriptions.ts`
- `lib/server/ai/nvidia.ts`
- `lib/server/ai/provider.ts`
- `lib/server/donations.ts`
- `lib/server/subscriptions.ts`
- `supabase/migrations/20260423100000_add_max_subscription_support.sql`

## 8. Arquivos alterados

- `README.md`
- `FRONTEND_INVENTORY.md`
- `AGENTS.md`
- `app/api/corrigir/route.ts`
- `app/api/doacao/webhook/route.ts`
- `app/api/gerar-tema/route.ts`
- `app/api/questoes/route.ts`
- `app/conta/ContaPageClient.tsx`
- `app/privacidade/page.tsx`
- `lib/server/conta.ts`
- `lib/server/stripe.ts`
- `types/supabase.ts`
- `package.json`
- `package-lock.json`
- `public/sitemap.xml`

## 9. Arquivos removidos

Nenhum arquivo foi removido para esta implementação.

## 10. Fluxo final da assinatura

### Criação

- autenticação exigida
- email confirmado exigido
- validação de origem
- rate limit
- customer Stripe coerente com o usuário Supabase
- criação de checkout recorrente mensal do plano Max

### Persistência

- checkout pendente salvo em `subscriptions`
- dados Stripe sincronizados para:
  - `stripe_customer_id`
  - `stripe_subscription_id`
  - `stripe_price_id`
  - `status`
  - `current_period_*`
  - `renews_at`
  - `cancel_at_period_end`
  - `cancel_at`
  - `canceled_at`

### Webhook

- validação via `STRIPE_WEBHOOK_SECRET`
- persistência do evento cru em `subscription_events`
- idempotência via `stripe_event_id`
- sincronização do estado consolidado em `subscriptions`

### Acesso premium

- somente `active` e `trialing` liberam `hasMaxAccess`
- se `current_period_end` já expirou, o acesso deixa de ser considerado válido
- a checagem ocorre no servidor antes de escolher NVIDIA

## 11. Validações executadas

### TypeScript

```bash
npx tsc --noEmit
```

Resultado:

- sucesso

### Lint

```bash
npm run lint
```

Saída:

```text
> foco-no-enem@0.1.0 lint
> eslint .
```

Resultado:

- sucesso

### Build

```bash
npm run build
```

Resultado:

- build concluído com sucesso
- novas rotas incluídas no output:
  - `/api/assinatura/checkout`
  - `/api/assinatura/portal`
- `public/sitemap.xml` foi regenerado pelo processo normal de build

## 12. Estado operacional atual

A configuração operacional do plano Max foi concluída em produção.

### Variáveis já configuradas na Vercel

Conferência final de `vercel env ls`:

```text
NVIDIA_API_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_MAX_PRICE_ID
GEMINI_API_KEY
SITE_URL
NEXT_PUBLIC_SITE_URL
GROQ_FALLBACK_API_KEY
GROQ_FALLBACK_MODEL
GROQ_MODEL
ADMIN_ALLOWED_EMAILS
SUPABASE_SERVICE_ROLE_KEY
NEWSAPI_API_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GROQ_API_KEY
```

### Recursos Stripe criados em live mode

- Produto live:
  - `prod_UODDDfDkdbjcln`
- Price live mensal:
  - `price_1TPQnLHWlyxCEd9bjbzX70sL`
  - `lookup_key=max_monthly`
- Webhook live:
  - `we_1TPQnNHWlyxCEd9bGCzvkNZv`
  - `url=https://foconoenem.vercel.app/api/doacao/webhook`

### Eventos habilitados no webhook live

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `checkout.session.expired`
- `checkout.session.async_payment_failed`
- `payment_intent.payment_failed`

### Deploy de produção após configuração

- deployment:
  - `dpl_5UqUsZjkKTWDen3p8gg6febrUmuV`
- alias final:
  - `https://foconoenem.vercel.app`
- status final:
  - `Ready`

## 13. Riscos remanescentes

- A consistência final da assinatura depende da entrega do webhook do Stripe.
- O checkout live e a cobrança real não foram disparados automaticamente para evitar cobrança indevida.
- O workspace ainda contém um arquivo não relacionado a esta entrega:
  - `FINAL_AUDIT_VERIFICATION_2026-04-23.md`
- O workspace ainda contém um arquivo não relacionado a esta entrega:
  - artefatos locais de skills em `.agents/` e `skills-lock.json`

## 14. Conclusão

O projeto agora possui:

- plano Max mensal de `R$ 10,00`
- fluxo de assinatura recorrente com Stripe
- portal do cliente
- persistência de assinatura no banco
- trilha de eventos de subscription
- seleção de IA por plano no backend
- integração NVIDIA via SDK `openai`
- UI de assinatura em `/conta`
- validação local de lint, typecheck e build
- configuração live aplicada na Stripe
- configuração de produção aplicada na Vercel
- deploy de produção atualizado com os valores live

O que resta é apenas validação funcional de cobrança real com um fluxo controlado de assinatura.

## 15. Caminho do relatório

Arquivo gerado:

`/home/ubuntu/PROJETOS/foconoenem/IMPLEMENTACAO_PLANO_MAX.md`
