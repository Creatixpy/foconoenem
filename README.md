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
- A página inicial em `app/page.tsx` compõe quatro seções em `app/_components/home/`, renderizadas no servidor: apresentação, recursos, funcionamento e chamada para começar.
- Supabase fornece autenticação e PostgreSQL. Os clientes SSR/browser estão em `lib/supabase/`, o acesso orientado a repositórios em `lib/db/` e os fluxos server-only em `lib/server/`.
- Páginas autenticadas usam `requireServerUser()` no servidor e entregam o usuário validado a `AuthProviders`, evitando um segundo bootstrap de autenticação no cliente.
- Operações privilegiadas passam pelo servidor com `SUPABASE_SERVICE_ROLE_KEY`; os grants públicos do banco devem permanecer mínimos.
- Groq atende os fluxos textuais de IA nos planos Free e Max. O SDK não faz retries internos; o orquestrador aplica timeout de 30 segundos e no máximo duas tentativas globais, usando fallback apenas para falhas transitórias ou uma segunda saída estruturada inválida.
- Gemini é usado para OCR pelo SDK oficial `@google/genai`. O servidor tenta, no máximo uma vez por modelo, `gemini-3.5-flash`, `gemini-2.5-flash` e `gemini-3.1-flash-lite`; só avança em falhas transitórias ou leitura evidentemente inválida. As fotos grandes são comprimidas no navegador e permanecem apenas em memória. NewsAPI atende a importação de notícias e Stripe atende assinaturas e doações.
- Limpezas, rate limiting e destaques usam RPCs transacionais acionadas sob demanda pelo próprio app, sem cron externo.
- A interface é exclusivamente dark e usa tokens semânticos em `app/styles/` e o componente `AprovIALogo` para a marca.
- Vercel Analytics e Speed Insights só são montados depois do consentimento para métricas opcionais.
- O runtime é inteiramente atendido pelos Route Handlers do Next.js; as Edge Functions remotas legadas foram removidas.

## Recuperação do trabalho e navegação

- Redações salvam texto, tema e `submissionId` no `localStorage`, por usuário. O rascunho é restaurado antes da edição e removido após correção salva, descarte confirmado ou logout explícito. Expiração de sessão e falhas de conexão preservam o rascunho. Fotos do OCR continuam apenas em memória; substituir texto diferente exige confirmação.
- Simulados usam `sessionStorage`, por usuário e por aba, preservando `requestId`, `attemptId`, `expiresAt`, posição e respostas. Retomar não cria outra tentativa automaticamente. O primeiro envio congela as respostas; retries manuais enviam o mesmo snapshot. Respostas 404/410 permitem começar um novo simulado.
- A redação aceita tema manual de 5–300 caracteres, 100–500 palavras e até 5.000 caracteres. Texto colado ou extraído acima dos limites permanece no editor para revisão.
- A disponibilidade exibida usa a mesma regra do servidor, das 7h às 23h30 em `America/Sao_Paulo`, e atualiza a cada minuto e ao voltar à aba. O servidor continua autorizando cada operação.
- Notícias sincronizam termo e modo com a URL: `q` pesquisa o acervo e `modo=ia` pede um resumo. Voltar/avançar restaura a pesquisa. Consultas antigas são invalidadas, paginação com erro mantém os artigos e o mesmo offset para retry, e destaques são revalidados em segundo plano pelo GET existente.
- Falhas de armazenamento são informadas na página. O salvamento depende do navegador; logout explícito também invalida gravações e rascunhos antigos de outras abas.

A verificação deste lote, incluindo os limites do QA com respostas controladas, está em [docs/student-workflows-qa.md](docs/student-workflows-qa.md).

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
| `npm run test:systems` | executar testes de contratos, rascunhos, idempotência, notícias e roteamento OCR |
| `npm run setup:security` | instalar verificações locais antes de commit e push, preservando hooks existentes |
| `npm run test:security` | testar verificadores de privacidade, índice, histórico e exportação com fixtures em memória/disco temporário |
| `npm run build` | gerar o build de produção e atualizar `public/sitemap.xml` |
| `npm run start` | servir o build de produção |
| `npm run verify:open-source` | verificar arquivos obrigatórios e segredos/artefatos privados no índice e na árvore atual |
| `npm run verify:history-clean` | verificar arquivos privados, blobs, mensagens e referências de todo o histórico alcançável |
| `npm run release:public-tree` | exportar somente os arquivos rastreados e aprovados do índice para um diretório novo |

A suíte Vitest é deliberadamente pequena e cobre schemas, serialização segura do quiz, notas ENEM, fingerprint idempotente, mapeamento persistido e fallback controlado do OCR. Mudanças não triviais nesses sistemas devem passar por `npm run test:systems`, `npm run lint`, build e QA do fluxo afetado.

## Estrutura do repositório

```text
app/                    páginas, layouts e Route Handlers do App Router
app/_components/home/   seções exclusivas da página inicial, como Server Components
app/api/                APIs ativas da aplicação
app/components/         componentes de layout, privacidade e funcionalidades
app/styles/             tokens e estilos do sistema visual dark
lib/auth/               autenticação, contexto, perfil, segurança e validação
lib/ai/                 integrações padrão com Groq e Gemini
lib/contracts/          contratos Zod e tipos neutros compartilhados
lib/db/                 cliente server-side, repositórios e utilitários de consulta
lib/client/             recuperação de rascunhos, erros, requisições e disponibilidade no navegador
lib/server/             regras server-only, autorização admin, segurança de APIs e importação de notícias
lib/server/ai/           runtime textual e validação de saídas estruturadas
lib/server/essay/        geração e correção canônicas de redação
lib/server/quiz/         geração e tentativas canônicas de questões
lib/supabase/           clientes SSR/browser e atualização de sessão
public/                 assets, verificações, robots, manifest e sitemap
scripts/                verificações e geração da árvore de release
supabase/migrations/    histórico local do schema
types/                  tipos compartilhados e tipos gerados do Supabase
tests/systems/          testes focados dos contratos e fluxos canônicos
```

Componentes exclusivos de uma página ficam próximos dela; `app/components/` reúne componentes compartilhados. Helpers privilegiados em `lib/server/` usam `server-only` e são importados diretamente pelos módulos que os utilizam.

`node_modules/` e `.next/` são artefatos locais gerados; o cache incremental do TypeScript fica em `.next/cache/typescript/tsconfig.tsbuildinfo`. Capturas de tela de desenvolvimento ficam em `.local/screenshots/`, e metadados locais de branches do Supabase em `supabase/.branches/`; esses caminhos não são versionados. As capturas também são excluídas do deploy.

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
- `npm run verify:open-source` valida a árvore atual e os blobs staged; corrigir um arquivo sem atualizar o índice não torna o commit seguro.
- `npm run verify:history-clean` verifica todo o histórico alcançável, incluindo conteúdo e metadados. Qualquer falha impede publicar aquele histórico.
- `npm run test:security` exercita essas proteções sem acessar provedores ou credenciais reais. A CI executa os testes e ambos os verificadores.
- `npm install` prepara os hooks locais de commit e push quando não há configuração anterior; `npm run setup:security` repete a instalação. Hooks alheios são preservados e precisam integrar os verificadores manualmente. O hook de push verifica também os commits propostos, antes do envio; a CI complementa essa barreira.
- Instruções locais de agentes (`AGENTS.md` e variantes), configurações de editores/MCP, arquivos de ambiente e relatórios privados ficam fora do Git, do deploy e da exportação pública. `.env.example` contém somente placeholders.
- `npm run release:public-tree` exporta o snapshot rastreado do índice: faça stage apenas dos arquivos aprovados. Arquivos não rastreados e mudanças unstaged não são copiados; o destino precisa ser novo e não pode estar dentro do projeto.
- Caso uma credencial seja exposta, siga [SECURITY.md](./SECURITY.md): a remoção de arquivos não substitui sua invalidação no provedor. Qualquer limpeza excepcional de histórico precisa preservar trabalho local, limitar as referências alteradas e verificar novamente o remoto.

## Documentação mantida

- [CONTRIBUTING.md](./CONTRIBUTING.md): setup, validação e regras para contribuições
- [SECURITY.md](./SECURITY.md): reporte de vulnerabilidades e tratamento de segredos
- [FRONTEND_INVENTORY.md](./FRONTEND_INVENTORY.md): inventário técnico das rotas, APIs e módulos atuais

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](./LICENSE).
