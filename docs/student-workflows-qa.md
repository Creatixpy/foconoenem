# Validação de Questões, Redação e Notícias

O lote preserva o trabalho do aluno após falhas, recupera tentativas e rascunhos
por usuário e melhora navegação, feedback e leitura. Os formatos das APIs,
provedores de IA, dependências e esquema do banco permanecem iguais.

## Checks automatizados

| Comando | Resultado |
| --- | --- |
| `npm run test:systems` | 33 testes passaram em 4 arquivos, com dados em memória e provedores simulados |
| `npm run lint` | Passou |
| `npx tsc --noEmit` | Passou; o build também verificou TypeScript |
| `npm run build` | Passou com Next.js 16.2.6 e Turbopack, incluindo geração de 33 páginas e sitemap |
| `npm run verify:open-source` | Passou para a árvore atual |
| `git diff --check` | Passou |
| `npm run verify:history-clean` | Falhou no histórico preexistente de configuração privada; publicação desse histórico bloqueada |

Os testes novos cobrem isolamento, restauração e descarte de rascunhos,
armazenamento indisponível/corrompido, logout explícito, invalidação entre abas,
preservação de IDs e respostas congeladas, interpretação de erros e espera,
limites de entrada, horários de São Paulo, consultas antigas e deduplicação.
O detalhe da notícia também é exercitado com falha dos relacionados, conteúdo
sanitizado, serviço indisponível e notícia inexistente com 404.

Uma compilação intermediária falhou na resolução interna das fontes do
Turbopack. Após encerrar o servidor local e isolar os artefatos gerados em
`.next`, a compilação limpa passou sem alterações no layout ou nas fontes.
As diferenças incidentais de sitemap/robots causadas pela configuração local
foram revisadas e removidas do lote.

## QA em navegador com respostas controladas

Foram executados 19 cenários em Chromium isolado, usando os componentes e CSS
do projeto, estado de autenticação simulado e respostas de API controladas.
Todos passaram sem exceções JavaScript. O ambiente temporário de QA fica fora
do repositório e não adiciona dependências ao aplicativo.

Quatro cenários complementares também passaram: falha dos destaques com e sem
conteúdo inicial, atualização do horário por minuto/retorno do foco e logout
entre abas removendo a tentativa e impedindo gravações atrasadas. A revisão
visual em 320px levou ao ajuste dos botões de navegação da redação; os cenários
afetados foram executados novamente após o ajuste.

| Área | Cenários verificados |
| --- | --- |
| Questões | Radios por teclado, Anterior, contagem, confirmação de respostas pendentes e Revisar na primeira questão sem resposta |
| Questões | Resposta de finalização perdida, reload e PATCH idêntico, sem criação automática de outra tentativa; recuperação de 404 e 410 |
| Questões | Sessão expirada, troca de usuário e limpeza no logout explícito |
| Redação | Restauração de texto/tema, troca de usuário, sessão expirada e descarte confirmado |
| Redação | Mesmo `submissionId` após resposta perdida; remoção do rascunho após correção salva |
| Redação | Troca para tema manual durante geração, apoio longo acessível em disclosure nativo e limites sem truncar o texto |
| Redação | Controles bloqueados durante correção, status junto ao envio e justificativa de fuga ao tema |
| OCR | Falha de rede e 429 com espera, retry com a mesma foto, comparação durante revisão e substituição confirmada; Cancelar preserva a revisão |
| Notícias | Erro distinto de busca vazia, CTA de resumo executando a consulta, termo/modo na URL e voltar/avançar nas duas telas |
| Notícias | Consultas fora de ordem, limpeza durante carregamento, paginação com erro preservando artigos/offset e deduplicação por ID |
| Notícias | Clipboard negado com link selecionável e tipografia local de parágrafos, títulos, listas, citações e links |
| Compartilhado | Armazenamento corrompido/indisponível preservando a edição, foco de navegação e movimento reduzido |

As buscas também foram exercitadas no servidor local Next.js com build de
produção: três cenários passaram cobrindo erro/vazio/CTA, consultas antigas e
limpeza, além do histórico e modo de `/noticias/pesquisa`. As respostas das APIs
continuaram controladas, e o consentimento de métricas foi recusado nesse perfil.

Foram verificadas larguras de 320, 390, 768, 1024 e 1440px, orientação horizontal
de 844×390 e ampliação de texto a 200%. Não houve rolagem horizontal indevida nos
cenários verificados; campos de texto mantiveram pelo menos 16px. A navegação
por teclado e a árvore de acessibilidade dos radios nativos foram inspecionadas.

## Limites e acompanhamento

- Não foram testados login real, persistência remota autenticada, chamadas reais
  de Groq/Gemini ou correções/extrações com provedores. Testes com respostas
  controladas e build não estabelecem que esses serviços funcionem em produção.
- A árvore de acessibilidade foi verificada em navegador, mas não houve uso de
  leitor de tela real. A ampliação foi de texto; zoom nativo do navegador,
  dispositivos físicos e outros navegadores continuam sem verificação.
- A publicação está bloqueada pelo check obrigatório do histórico. A orientação
  de [CONTRIBUTING.md](../CONTRIBUTING.md#publication) proíbe suprimir esse check
  ou reescrever o histórico automaticamente. O lote pode ser revisado localmente;
  a publicação depende da resolução dessa pendência conforme
  [README.md](../README.md) e [SECURITY.md](../SECURITY.md).
