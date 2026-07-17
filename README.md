# AprovIA

Plataforma web para preparação para o ENEM, com prática de redação, simulados, notícias, acompanhamento de desempenho e recursos de IA. O frontend e o backend vivem no mesmo projeto Next.js.

Aplicação pública: [aproviaedu.vercel.app](https://aproviaedu.vercel.app)

## Visão geral

O AprovIA oferece:

- geração de temas e correção de redações por competências
- simulados com resultados persistidos e agregados recalculados no servidor
- feed de notícias aprovadas, busca, moderação e resumos baseados no acervo salvo
- conta com histórico, estatísticas, edição de perfil e exclusão segura
- plano Max mensal com teste inicial de 7 dias e gerenciamento pelo Stripe
- doações via Stripe Checkout
- OCR com Gemini para extrair texto de imagens no fluxo de redação

O feedback produzido por IA é uma orientação de estudo. Ele não substitui professores, correções humanas ou materiais oficiais e não representa garantia de nota ou aprovação.

## Arquitetura

- Next.js 16 App Router e React 19 compõem a aplicação full-stack.
- Páginas e layouts ficam em `app/`; Route Handlers ativos ficam em `app/api/`.
- Supabase fornece autenticação e PostgreSQL. Os clientes SSR/browser estão em `lib/supabase/`, o acesso orientado a repositórios em `lib/db/` e os fluxos server-only em `lib/server/`.
- Páginas autenticadas usam `requireServerUser()` no servidor e entregam o usuário validado a `AuthProviders`, evitando um segundo bootstrap de autenticação no cliente.
- Operações privilegiadas passam pelo servidor com `SUPABASE_SERVICE_ROLE_KEY`; os grants públicos do banco devem permanecer mínimos.
- Groq atende os fluxos textuais de IA nos planos Free e Max. O SDK não faz retries internos; o orquestrador aplica timeout de 30 segundos e no máximo duas tentativas globais, usando fallback apenas para falhas transitórias ou uma segunda saída estruturada inválida.
- Gemini é usado para OCR pelo SDK oficial `@google/genai`, NewsAPI para importação de notícias e Stripe para assinaturas e doações.
- Limpezas, rate limiting e destaques usam RPCs transacionais acionadas sob demanda pelo próprio app, sem cron externo.
- A interface é exclusivamente dark e usa tokens semânticos em `app/styles/` e o componente `AprovIALogo` para a marca.
- Vercel Analytics e Speed Insights só são montados depois do consentimento para métricas opcionais.
- O runtime é inteiramente atendido pelos Route Handlers do Next.js; as Edge Functions remotas legadas foram removidas.

## Stack principal

- Next.js 16.2
- React 19.2
- TypeScript 6
- Tailwind CSS 4
- Supabase SSR e PostgreSQL
- Groq e Gemini
- Stripe
- NewsAPI
- Vercel Analytics e Speed Insights

## Requisitos e instalação

- Node.js 20.9 ou superior
- npm
- um projeto Supabase para autenticação e persistência

```bash
npm install
cp .env.example .env.local
npm run dev
```

Depois de preencher as variáveis necessárias, acesse `http://localhost:3000`.

## Variáveis de ambiente

Use `.env.example` como referência e nunca versione `.env.local` ou chaves reais.

| Variável | Necessidade | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | obrigatória | URL dos clientes Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | obrigatória | autenticação e sessão com RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | obrigatória para operações privilegiadas | gravações server-side, administração, manutenção, pagamentos e leituras protegidas |
| `NEXT_PUBLIC_SITE_URL` | recomendada | metadata, redirects e URLs públicas |
| `SITE_URL` | recomendada | geração do sitemap |
| `GROQ_API_KEY` | obrigatória para a IA textual | redações, temas, questões e notícias nos planos Free e Max |
| `GROQ_MODEL` | opcional | modelo primário da Groq |
| `GROQ_FALLBACK_API_KEY` | opcional | chave do fallback Groq |
| `GROQ_FALLBACK_MODEL` | opcional | modelo do fallback |
| `GROQ_MAX_ATTEMPTS` | opcional | teto global de tentativas Groq, limitado pelo código a 2 |
| `GEMINI_API_KEY` | necessária para OCR | extração de texto em `/api/ocr` |
| `STRIPE_SECRET_KEY` | necessária para pagamentos | checkout, portal e sincronização Stripe |
| `STRIPE_WEBHOOK_SECRET` | necessária para o webhook | validação da assinatura dos eventos |
| `STRIPE_MAX_PRICE_ID` | necessária para o Max | ID do preço mensal recorrente |
| `NEWSAPI_API_KEY` ou `NEWSAPI_KEY` | necessária para importação | importação pelo painel de notícias |
| `ADMIN_ALLOWED_EMAILS` | necessária para administração | allowlist de emails, separada por vírgulas |

`NODE_ENV` é definido pelo runtime. Na Vercel, `VERCEL`, `VERCEL_URL` e `VERCEL_PROJECT_PRODUCTION_URL` são fornecidas automaticamente quando disponíveis.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | iniciar o desenvolvimento com Turbopack |
| `npm run lint` | executar ESLint no repositório |
| `npm run test:systems` | executar os testes focados dos contratos de redação e quiz |
| `npm run build` | gerar o build de produção e atualizar `public/sitemap.xml` |
| `npm run start` | servir o build de produção |
| `npm run verify:open-source` | verificar arquivos obrigatórios, artefatos privados e padrões comuns de segredo |
| `npm run verify:history-clean` | verificar o histórico Git local contra arquivos e segredos de alto risco |
| `npm run release:public-tree` | criar uma árvore publicável limpa em `../aprovia-public-release` |

A suíte Vitest é deliberadamente pequena e cobre schemas, serialização segura do quiz, notas ENEM, fingerprint idempotente e mapeamento do resultado persistido. Mudanças não triviais nesses sistemas devem passar por `npm run test:systems`, `npm run lint`, build e QA do fluxo afetado.

## Estrutura do repositório

```text
app/                    páginas, layouts e Route Handlers do App Router
app/api/                APIs ativas da aplicação
app/components/         componentes de layout, privacidade e funcionalidades
app/styles/             tokens e estilos do sistema visual dark
lib/auth/               autenticação, contexto, perfil, segurança e validação
lib/ai/                 integrações padrão com Groq e Gemini
lib/contracts/          contratos Zod e tipos neutros compartilhados
lib/db/                 cliente server-side, repositórios e utilitários de consulta
lib/server/             regras server-only, incluindo orquestração de redação, quiz e IA por plano
lib/supabase/           clientes SSR/browser e atualização de sessão
public/                 assets, verificações, robots, manifest e sitemap
scripts/                verificações e geração da árvore de release
supabase/migrations/    histórico local do schema
types/                  tipos compartilhados e tipos gerados do Supabase
```

## Áreas e rotas principais

| Área | Interface | Backend |
| --- | --- | --- |
| Autenticação | `/login`, `/register`, `/forgot-password`, `/reset-password` | `/auth/callback` e Supabase Auth |
| Redação | `/redacao`, `/resultados/[id]` | `POST /api/gerar-tema`, `POST /api/corrigir`, `POST /api/ocr`; o resultado é carregado no Server Component |
| Questões | `/questoes` | `POST /api/questoes` cria a tentativa e `PATCH /api/questoes` corrige/persiste no servidor |
| Notícias | `/noticias`, `/noticias/[slug]`, `/noticias/pesquisa`, `/noticias/admin` | rotas sob `/api/noticias`, além de moderação, importação e destaques |
| Conta | `/conta`, `/conta/editar` | `/api/conta/dados`, `/api/conta/recalcular`, `/api/conta/excluir`, `/api/perfil` |
| Plano Max | `/planos`, gerenciamento também em `/conta` | `/api/assinatura/status`, `/api/assinatura/checkout`, `/api/assinatura/portal` |
| Doações | `/doacao`, `/doacao/sucesso` | `/api/doacao/checkout`, `/api/doacao/webhook` |

O Max custa R$ 10,00 por mês e oferece um teste único de 7 dias para usuários elegíveis. A elegibilidade e o acesso são validados no backend; o webhook compartilhado em `/api/doacao/webhook` sincroniza tanto doações quanto assinaturas.

Na exclusão de uma conta, o app remove primeiro tentativas de quiz, redações, simulados e analytics pertencentes ao usuário e só então exclui o usuário no Supabase Auth. Essa ordem preserva a limpeza de dados mesmo com foreign keys históricas que usam `ON DELETE SET NULL`.

## Supabase e operação

- Migrations em `supabase/migrations/` são a fonte local de verdade do schema.
- O histórico local está reconciliado com o remoto; não use `migration repair`, reescrita do histórico ou `db reset` em produção.
- Os tipos gerados pelo Supabase ficam em `types/supabase.ts`.
- O snapshot remoto antigo foi removido; não recrie snapshots paralelos às migrations.
- `quiz_attempts` e `quiz_attempt_questions` guardam por 24 horas a seleção canônica entregue ao usuário. O browser nunca recebe `isCorrect` ou explicações antes da finalização; o servidor calcula a correção a partir do catálogo, e retries retornam o mesmo `quiz_result`.
- Questões reutilizáveis têm fingerprint normalizado, validação estrutural e retenção de 30 dias quando não estão referenciadas. O Free reaproveita o catálogo controlado; o Max recebe conteúdo novo, persistido com deduplicação atômica.
- Temas Free são compartilhados e balanceados; temas Max são privados e vinculados ao usuário. Ambos expiram do catálogo após 7 dias, enquanto o snapshot histórico em `essay_results` permanece preservado.
- Correções usam `submissionId` e fingerprint da entrada. Repetições retornam o resultado ou a mesma rejeição por fuga ao tema; colisões de conteúdo são recusadas. Novas notas por competência aceitam somente 0, 40, 80, 120, 160 ou 200 e precisam somar a nota total.
- Estatísticas de redação e quiz são recalculadas por triggers transacionais; questões sem resposta não entram no denominador da taxa de acerto.
- Limpeza de `rate_limits`, `analytics_events`, `cached_themes`, tentativas, questões sem referência e claims de redação ocorre em janelas controladas por uma RPC de manutenção.
- Rate limit, incremento de temas, destaques e claims de webhooks Stripe usam operações atômicas restritas a `service_role`.
- Destaques de notícias são recalculados após moderação ou quando estão vazios ou vencidos.

## Segurança e publicação open source

- Nunca exponha tokens, service-role keys, chaves Stripe/IA, arquivos `.env`, pulls da Vercel ou configurações locais de agentes e editores.
- Vulnerabilidades não devem ser abertas em issues públicas; siga [SECURITY.md](./SECURITY.md).
- Antes de publicar, rotacione qualquer segredo que possa ter aparecido em arquivos locais ou no histórico. A proteção contra senhas vazadas do Supabase Auth deve ser ativada quando o projeto sair do plano Free.
- `npm run verify:open-source` valida a árvore publicável atual.
- `npm run verify:history-clean` ainda bloqueia o histórico existente porque encontra `.vscode/mcp.json` em revisões antigas. Isso é uma pendência conhecida, não uma autorização para publicar esse histórico como limpo.
- Para uma publicação segura, use uma árvore com histórico novo/orphan após a rotação dos segredos, ou faça uma reescrita de histórico revisada por todos os colaboradores. `npm run release:public-tree` prepara a árvore atual para esse fluxo.

## Documentação mantida

- [CONTRIBUTING.md](./CONTRIBUTING.md): setup, validação e regras para contribuições
- [SECURITY.md](./SECURITY.md): reporte de vulnerabilidades e tratamento de segredos
- [FRONTEND_INVENTORY.md](./FRONTEND_INVENTORY.md): inventário técnico das rotas, APIs e módulos atuais
- [AGENTS.md](./AGENTS.md): diretrizes operacionais para agentes e colaboradores

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](./LICENSE).
