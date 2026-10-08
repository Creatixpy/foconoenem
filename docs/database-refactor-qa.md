# Integração do banco com o site

O lote padroniza clientes, cancelamento e erros de banco, separa persistência
dos handlers e inclui a refatoração de estudo já preparada na branch. Mantém
formatos de resposta, isolamento de usuários, planos, claims idempotentes,
snapshots históricos, drafts e validação de origem.

## Critério de cobertura

Não existe uma unidade objetiva para medir código “60% mais limpo”. O critério
operacional adotado é refatorar pelo menos 60% dos módulos da integração
existentes na base `d743cb5`, revisando contratos e verificando falhas.
O percentual mede cobertura; não representa ganho de desempenho, remoção de
60% das linhas ou reescrita de todo o site.

O inventário inclui todos os arquivos TypeScript de `lib/db/` e `lib/supabase/`
e os módulos de `lib/server/` que fazem chamadas diretas `.from('...')` ou
`.rpc('...')`. São 17 módulos na base; 14 receberam mudanças, **82,35%**.
Os sete módulos originais de `lib/db/` e `lib/supabase/` foram refatorados,
**100%** dessa camada. Os novos repositórios não aumentam artificialmente o
numerador desse inventário.

| Área | Resultado verificável |
| --- | --- |
| Clientes | Admin sem sessão reutilizado e invalidado por configuração; SSR e cookies isolados por requisição; configuração pública centralizada. |
| Transporte | Prazo de 8s por troca HTTP, incluindo corpo; cancelamento externo propagado; nenhuma nova política de retry de escrita. |
| Consultas | `runQuery` concentra erros tipados e prazo total, incluindo espera entre retries do SDK. Repositórios usam 8s; recuperação de tentativa e rate limit usam 4s. |
| Persistência | Conta, perfil e notícias ganham repositórios. Consultas usam dono/aprovação e ordenação estável. Ausência e falha continuam distintas. |
| Falhas de lote | Escritas de catálogo já iniciadas terminam antes de o lote devolver erro; retries e snapshots canônicos são preservados. |
| Sessão e auditoria | Renovação preserva cookies e headers de cache do SSR. Auditoria usa prazo próprio ou o signal compartilhado da manutenção. |
| Código de estudo | Apresentação, estado de quiz, HTTP, temas, snapshots e concorrência ficam em módulos próprios, com os mesmos contratos públicos. |

A inspeção pelo Supabase MCP confirmou correspondência das 46 migrations
locais/remotas e do schema público tipado. Os tipos foram regenerados com a
versão atual do PostgREST. Nenhuma nova mudança remota de schema ou dados foi
necessária neste lote. A migration corretiva de manutenção já aplicada continua
versionada; seu histórico não foi reescrito.

## Verificação e limites

| Comando | Resultado |
| --- | --- |
| `npm run test:systems` | 128 testes em 16 arquivos passaram. |
| `npm run lint` | Passou. |
| `npm run build` | Build Next.js, TypeScript e geração de sitemap passaram. |
| `npm run test:security` | 16 regressões passaram. |
| `npm run verify:open-source` | Árvore e índice passaram; repetir sobre o índice final antes de publicar. |
| `npm run verify:history-clean` | Histórico passou; os hooks também verificam o commit/push final. |
| `git diff --check` | Passou. |

As regressões usam o SDK Supabase instalado com `fetch` local controlado ou
fixtures em memória. Verificam cancelamento durante o corpo da resposta,
espera `Retry-After`, isolamento SSR, cookies renovados, ownership, ausência,
multiplicidade, falhas de persistência, rate limit e writes de lote em voo.

Passaram 21 cenários controlados de navegador: redação, questões, drafts,
troca de usuário/logout, OCR com retry, cinco larguras e acessibilidade.
Dois timeouts iniciais de navegação do harness passaram na reexecução com menos
concorrência. O harness usa autenticação e respostas de API simuladas.

A investigação pela CLI da Vercel confirmou Git conectado, produção em `main`,
conteúdo público disponível, notícias existentes com 200 e ausentes com 404,
além das barreiras de autenticação. Push na branch de trabalho gera preview;
o build automático deve ser identificado pelo SHA do commit e acompanhado
até `READY` antes de considerar a publicação validada.

Leituras de notícias exercitam o caminho remoto site → banco. QA controlado,
lint, testes e build não demonstram login real, gravações autenticadas ou
chamadas reais de Groq/Gemini/Stripe. Não há benchmark antes/depois que prove
uma melhora de 60% em latência ou disponibilidade.
