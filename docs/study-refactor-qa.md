# Refatoração de redações e questões

O lote organiza os fluxos de estudo sem mudar os formatos das APIs, planos,
provedores ou critérios de nota. A correção continua sendo
canônica por `submissionId` e fingerprint; simulados preservam `requestId`,
`attemptId` e o primeiro snapshot de respostas. Rascunhos mantêm o isolamento
por usuário/origem, o descarte no logout explícito e a recuperação após falhas.

## Organização e execução

| Área | Alteração |
| --- | --- |
| Redação no navegador | Tema, checklist e ícones ficam em componentes locais; helpers puros concentram mensagens e estados de apresentação. O envio de foto tem carregamento separado com `next/dynamic`. |
| Questões no navegador | A página compõe a interface; `use-quiz-workflow.ts` controla draft/navegação/envio e `quiz-api.ts` valida respostas HTTP antes de persistir estado. |
| Redação no servidor | `themes.ts` resolve temas e textos de apoio, `result.ts` monta o snapshot histórico, `errors.ts` compartilha erros e `service.ts` orquestra claim, análise e persistência. Replays não carregam assinatura/runtime de IA. |
| Questões no servidor | Replays recuperam a tentativa antes de carregar o runtime. Novas tentativas leem plano e catálogo em paralelo. O helper de concorrência admite duas disciplinas, para novos trabalhos na primeira falha e aguarda os que já começaram. |
| Banco | Repositórios aplicam cancelamento de 8s por consulta/RPC; recuperação de tentativa usa 4s por consulta. Persistência canônica e snapshots continuam transacionais. |
| Manutenção e métricas | `after()` retira limpeza de claims e catálogo/tentativas do caminho da resposta, junto dos eventos de geração de tema e correção. RPC de manutenção e auditoria compartilham 8s; inserção de analytics tem 4s. |
| Janela de manutenção | Uma nova migration corrige a leitura de timestamps antigos com `T` ou espaço, trata datas inválidas e grava ISO UTC, preservando lock, intervalos, retenções e snapshots históricos. |
| Catálogo de temas | A limpeza permanece antes da seleção, em paralelo ao runtime, porque a seleção canônica depende da remoção dos temas vencidos. |
| OCR | Requisição já cancelada não inicializa o provedor nem dispara fallback; retries internos do SDK permanecem desativados e cada modelo tem prazo de 25s. |
| Vercel | Route Handlers de estudo declaram Node.js e `maxDuration`: correção 180s, tema 120s, questões 300s e OCR 120s. Artefatos `.vercel/` são ignorados pelo ESLint. |

Os limites de função acomodam os caminhos de IA já existentes; não aumentam o
orçamento global de duas tentativas da IA textual nem a quantidade de tentativas
por modelo OCR. Não houve atualização de dependências. A migration corretiva de
manutenção foi aplicada pelo Supabase MCP e registrada em
`supabase/migrations/20261008050718_fix_maintenance_timestamp_throttle.sql`.

## Verificações concluídas

| Comando | Resultado |
| --- | --- |
| `npm run test:systems` | 102 testes passaram em 11 arquivos, usando dados em memória e provedores simulados. |
| `npm run lint` | Passou. |
| `npm run build` | Passou com Next.js 16.2.6, verificação de TypeScript e geração do sitemap com domínio canônico. |
| `npm run test:security` | 16 testes passaram. |
| `npm run verify:open-source` | Passou para a árvore atual. |
| `npm run verify:history-clean` | Passou. |
| `vercel build --prod` | Passou com Vercel CLI 54.20.1 e Next.js 16.2.6, gerando `.vercel/output`. |
| `vercel build --prod --standalone` | Build final de publicação passou, incluindo `npm run build` e verificação de TypeScript; o lint também passou após a configuração do tracing. |

A cobertura nova verifica replay de correções sem runtime, rejeições reutilizáveis
por fuga ao tema, colisões, resolução de tema por proprietário, recuperação da
tentativa sem gabarito, política Free/Max, deduplicação canônica, duas gerações
concorrentes, interrupção de novos jobs na falha, snapshot de resultado,
cancelamento de RPC/analytics/auditoria e cancelamento/fallback do OCR.

## Validação com a CLI da Vercel

O build local de produção passou. A inspeção dos artefatos gerados confirmou
runtime `nodejs22.x` e `maxDuration` de 180s para `/api/corrigir`, 120s para
`/api/gerar-tema`, 300s para `/api/questoes` e 120s para `/api/ocr`.
Essa etapa validou o build local antes da publicação de produção registrada abaixo.

O servidor foi iniciado com
`vercel dev --local-config <arquivo-json-temporário> --listen 127.0.0.1:4174`.
Passaram nove verificações HTTP de acesso público e barreiras de
autenticação/origem:

| Requisição | Resultado |
| --- | --- |
| `GET /` | `200`. |
| `GET /redacao` e `GET /questoes`, sem sessão | `307` para login. |
| `POST /api/corrigir`, `/api/gerar-tema`, `/api/ocr` e `/api/questoes`, sem sessão | `401 not_authenticated`, com `Origin: http://127.0.0.1:4174` e `Sec-Fetch-Site: same-origin`. |
| `PATCH /api/questoes`, sem sessão | `401 not_authenticated`, com `Origin: http://127.0.0.1:4174` e `Sec-Fetch-Site: same-origin`. |
| `POST /api/corrigir` com `Origin` externo | `403 forbidden_origin`. |

Na execução inicial, o projeto vinculado carregava valores de desenvolvimento
remotos para `SITE_URL` e `NEXT_PUBLIC_SITE_URL`, substituindo a origem local
fornecida ao processo. Isso causou `403` para requisições do próprio localhost.
A configuração JSON temporária, fora do repositório, definiu explicitamente ambas
as variáveis com a origem do proxy local; os nove checks passaram com `Origin`
real. Nenhuma configuração do aplicativo ou regra de validação de origem precisou
ser alterada. Esses testes verificam as barreiras HTTP e não demonstram um fluxo
autenticado completo pelo proxy da CLI.

## Configuração do build de publicação

`next.config.ts` aplica `outputFileTracingExcludes` globalmente para arquivos
privados. A publicação prebuilt complementa as exclusões do tracing com inspeção
dos artefatos e remoção de arquivos locais de ambiente, de suas referências e de
diagnósticos locais do pacote isolado. Credenciais de runtime continuam fornecidas
pelo ambiente da Vercel.

A preparação usou `vercel build --prod --standalone` com variáveis de produção.
O build final e a revisão dos artefatos passaram. O pacote isolado preservou seus
links e os aliases de funções e de dependências externas em `filePathMap`.
O preparo recompôs aliases de dependências externas usando apenas arquivos já
incluídos pelo tracing. As referências restantes foram verificadas dentro do
pacote, sem criar outra função ou alterar a implementação de runtime.

## Publicação de produção

Em 08/10/2026, o pacote prebuilt foi publicado com Vercel CLI 54.20.1 por
`vercel deploy --prebuilt --prod --skip-domain --yes` e promovido com
`vercel promote`. A inspeção da CLI confirmou estado `READY`, destino
`production` e o domínio canônico [aproviaedu.vercel.app](https://aproviaedu.vercel.app)
apontando para a nova publicação.

Na publicação final, passaram 17 checks HTTP antes da promoção e 17 no domínio
público após a promoção:

| Requisição no domínio canônico | Resultado |
| --- | --- |
| `GET /`, `/login`, `/sitemap.xml` e `/robots.txt` | `200`. |
| `GET /redacao` e `/questoes`, sem sessão | `307` para login. |
| `POST /api/corrigir`, `/api/gerar-tema`, `/api/ocr` e `/api/questoes`, sem sessão | `401 not_authenticated` com origem canônica. |
| `PATCH /api/questoes`, sem sessão | `401 not_authenticated` com origem canônica. |
| `POST /api/corrigir` com `Origin` externo | `403 forbidden_origin`. |
| `GET /noticias` e três artigos existentes | `200`. |
| `GET` de artigo inexistente | `404`. |

Após os 17 checks, a consulta de logs filtrada exclusivamente pela publicação
final retornou zero registros de nível `error` na janela de uma hora, com limite
de 100 registros. Esse resultado se restringe à janela e ao filtro consultados.

Esses checks confirmam a publicação, o conteúdo público, a leitura de notícias
e as barreiras HTTP.
Não exercitam correção, geração ou gravações de um usuário autenticado.

## QA em navegador com respostas controladas

Passaram 21 cenários em navegador isolado, usando os componentes do projeto,
autenticação simulada e respostas de API controladas. O ambiente de QA não
adiciona dependências ao aplicativo.

| Área | Cenários verificados |
| --- | --- |
| Redação | 12 cenários: sete fluxos de tema/editor/correção/rascunho/OCR e cinco larguras de 320, 390, 768, 1024 e 1440px, com verificação automatizada de acessibilidade pelo axe. |
| Redação complementar | Quatro cenários: usuário/sessão/logout; rascunhos antigos ou corrompidos e proteção ao sair; retry OCR com a mesma foto após 429; orientação horizontal, reflow e fonte de campo com pelo menos 16px. |
| Questões | Cinco cenários: teclado/navegação/confirmação; finalização com resposta perdida e reload enviando PATCH idêntico sem novo POST; 404; 410; sessão/usuário/logout. |

Nos 12 cenários iniciais de redação e nos cinco de questões não houve erros
JavaScript registrados. Os quatro cenários complementares passaram suas
asserções, mas não coletaram globalmente os erros de console.

## Limites da validação

Não foram testados login real, persistência remota autenticada ou chamadas reais
de Groq/Gemini. A compilação, os testes HTTP da CLI, o QA com respostas
controladas e a suíte com provedores simulados não estabelecem que esses serviços
funcionem em produção. A validação PostgreSQL abaixo usa fixtures isoladas; não
acionou limpeza de dados remotos.

## Correção e validação de banco

A inspeção confirmou na função remota o mesmo problema da definição histórica:
`previous_run` só era reconhecido com `YYYY-MM-DDT`, enquanto a função gravava
`current_run::text`, cujo formato usa espaço entre data e hora. Assim, o horário
gravado deixava de ser reconhecido e a limpeza podia rodar em cada chamada.

`20261008050718_fix_maintenance_timestamp_throttle.sql` foi aplicada com
`apply_migration` pelo Supabase MCP. A função agora aceita ambos os separadores,
recupera datas inválidas sem bloquear permanentemente a manutenção e grava ISO
em UTC com precisão de microssegundos. A migration histórica foi preservada.

Antes da aplicação foram inspecionados schema, RLS e grants de dez tabelas,
a unicidade de `configuracoes.chave` e o histórico de migrations. Após a aplicação,
o corpo remoto correspondeu exatamente ao candidato revisado e o histórico
anterior permaneceu intacto. Foram confirmados `SECURITY DEFINER`, `search_path`
vazio e execução restrita a `postgres`/`service_role`, sem acesso de `anon` ou
`authenticated`. A assinatura da função não mudou, dispensando alteração de
`types/supabase.ts`. Os advisors não apresentaram novos apontamentos.

Os testes de banco passaram em PostgreSQL 16.15 isolado, sem dados de produção:

| Verificação | Resultado |
| --- | --- |
| Seis tarefas de manutenção | Intervalos e predicados de retenção preservados. |
| Timestamps antigos e inválidos | Valores com `T` ou espaço reconhecidos; valores inválidos tratados; novas gravações em ISO UTC. |
| Transação e permissões | Rollback e ACL verificados. |
| Snapshots de resultados | Histórico preservado durante a manutenção das fixtures. |
| Concorrência | Em 12 sessões simultâneas, uma executou a tarefa e 11 respeitaram a janela de execução. |

A operação remota alterou somente a função. Nenhum teste com DML ou chamada de
limpeza foi executado no banco remoto.
