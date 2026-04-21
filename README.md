# Foco no ENEM

Plataforma web para preparação para o ENEM construída com Next.js 16, React 19 e Supabase.

O projeto atual concentra toda a lógica ativa no próprio app Next.js:

- redação com geração de tema, correção por IA e consulta de resultados
- simulados de questões com persistência de desempenho
- notícias com moderação, destaques, busca textual e resumo com IA baseado no banco
- área de conta com estatísticas e edição de perfil
- doações via Stripe
- OCR de imagem com Gemini para apoiar o fluxo de redação

## Arquitetura atual

- Frontend e backend vivem no mesmo repositório, via App Router e Route Handlers em `app/api`.
- O banco e a autenticação usam Supabase com tipos gerados em `types/supabase.ts`.
- Operações privilegiadas usam `SUPABASE_SERVICE_ROLE_KEY` no servidor.
- O histórico de schema fica em `supabase/migrations/`.
- O diretório `supabase/functions/` existe apenas para documentar Edge Functions remotas legadas; o runtime atual não depende delas.

## Stack

- Next.js 16
- React 19
- TypeScript 6
- Tailwind CSS 4
- Supabase SSR + PostgreSQL
- Groq para geração/correção/resumos
- Gemini para OCR
- Stripe para checkout e webhook de doações
- NewsAPI para importação de notícias
- Vercel Analytics e Speed Insights em produção

## Requisitos

Use uma versão atual do Node.js compatível com Next.js 16 e npm.

## Variáveis de ambiente

Crie `.env.local` na raiz do projeto. Nem todas as variáveis são obrigatórias para todas as rotas; a tabela abaixo indica o uso real.

| Variável | Status | Uso real |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | obrigatória | base de todos os clientes Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | obrigatória | auth, consultas com RLS e leitura pública |
| `NEXT_PUBLIC_SITE_URL` | recomendada | metadata, redirects e URLs públicas |
| `SITE_URL` | recomendada | geração do sitemap |
| `SUPABASE_SERVICE_ROLE_KEY` | obrigatória para fluxos administrativos/privilegiados | rotas admin, analytics server-side, importação, manutenção e gravações privilegiadas |
| `GROQ_API_KEY` | obrigatória para IA principal | `/api/corrigir`, `/api/gerar-tema`, `/api/questoes`, `/api/noticias/gpt-busca` |
| `GROQ_MODEL` | opcional | modelo primário da Groq |
| `GROQ_FALLBACK_API_KEY` | opcional | provedor secundário quando há rate limit |
| `GROQ_FALLBACK_MODEL` | opcional | modelo secundário |
| `GROQ_MAX_ATTEMPTS` | opcional | tentativas por provedor |
| `GEMINI_API_KEY` | opcional | OCR em `/api/ocr` |
| `STRIPE_SECRET_KEY` | opcional | checkout de doações |
| `STRIPE_WEBHOOK_SECRET` | opcional | validação do webhook do Stripe |
| `NEWSAPI_API_KEY` ou `NEWSAPI_KEY` | opcional | importação de notícias no painel admin |
| `ADMIN_ALLOWED_EMAILS` | necessária para acesso admin por usuário | allowlist do painel/admin APIs |
| `ADMIN_CRON_SECRET` ou `CRON_SECRET` | opcional | autenticação de cron e chamadas automatizadas |
| `RAPIDAPI_KEY` | opcional | provedor de horário preferencial |
| `RAPIDAPI_WORLD_TIME_URL` | opcional | override da URL RapidAPI de horário |
| `WORLD_TIME_API_URL` | opcional | override do fallback de horário |
| `WORLD_TIME_API_KEY` | opcional | alias aceito para integração de horário |
| `WORLD_TIME_RAPIDAPI_KEY` | opcional | alias aceito para integração de horário |

Exemplo mínimo para desenvolvimento de boa parte do app:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000

SUPABASE_SERVICE_ROLE_KEY=sua-service-role

GROQ_API_KEY=sua-chave-groq
GROQ_MODEL=openai/gpt-oss-120b

ADMIN_ALLOWED_EMAILS=admin@exemplo.com
```

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
npm run start
```

Observações:

- `npm run build` executa `next build` e depois `next-sitemap`, atualizando `public/sitemap.xml`.
- Hoje não há suíte automatizada de testes no repositório; a validação prática do projeto passa por `npm run lint`, `npm run build` e QA manual.

## Estrutura do repositório

```text
app/                    rotas, páginas e APIs do Next.js
app/api/                route handlers ativos do sistema
lib/auth/               autenticação, perfis, metas e estatísticas
lib/ai/                 integração com Groq e Gemini
lib/db/                 camada de acesso ao banco e repositórios
lib/server/             helpers server-only (conta, notícias, horário, analytics, rate limit)
lib/supabase/           clientes SSR/browser e atualização de sessão
public/                 assets, arquivos de verificação, robots e sitemap
supabase/migrations/    histórico local de schema
supabase/functions/     documentação do legado de Edge Functions
types/                  tipos compartilhados e tipos gerados do Supabase
```

## Áreas funcionais

### Redação

- página em `app/redacao`
- geração de tema via `/api/gerar-tema`
- correção via `/api/corrigir`
- consulta individual de resultado via `/api/resultados/[id]`
- OCR opcional via `/api/ocr`

### Questões

- página em `app/questoes`
- geração via `/api/questoes`
- persistência do resultado do quiz para usuários autenticados

### Notícias

- feed público, detalhe por slug e busca textual
- painel admin em `/noticias/admin`
- importação via NewsAPI
- destaques atualizados por rota administrativa e cron
- resumo com IA restrito ao conteúdo já aprovado e armazenado no banco

### Conta e autenticação

- login, cadastro, reset de senha e callback OAuth com Supabase
- dashboard em `/conta`
- edição de perfil em `/conta/editar`

### Doações

- checkout server-side em `/api/doacao/checkout`
- webhook em `/api/doacao/webhook`

## Supabase e operações

- As migrations locais estão em `supabase/migrations/`.
- O snapshot `supabase/remote-latest.sql` existe como referência, não como fonte principal de edição manual.
- O arquivo [supabase/functions/README.md](./supabase/functions/README.md) documenta o legado de Edge Functions remotas ainda implantadas.

## Documentação interna

- [README.md](./README.md): visão geral, setup e operação
- [FRONTEND_INVENTORY.md](./FRONTEND_INVENTORY.md): inventário fiel da estrutura atual do repositório
- [AGENTS.md](./AGENTS.md): diretrizes de colaboração no código
- [supabase/functions/README.md](./supabase/functions/README.md): estado do legado de Edge Functions
