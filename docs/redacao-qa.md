# Validação das melhorias de Redação

O lote mantém os contratos de correção, limites de entrada, provedores,
idempotência e rascunhos exclusivamente no navegador. Não há dependências,
tabelas, migrações ou APIs novas.

## Checks automatizados

- `npm run test:systems`: 61 testes em 6 arquivos, com dados controlados.
- `npm run lint` e `npm run build`: passaram com Next.js 16.2.6 e TypeScript;
  sitemap revisado no domínio canônico, sem páginas privadas ou de autenticação.
- `npm run test:security`: 16 testes passaram.
- `npm run verify:open-source`, `npm run verify:history-clean` e
  `git diff --check`: passaram; arquivos privados não são entradas de publicação.

A cobertura acrescentada verifica horários de salvamento somente após escrita,
compatibilidade com envelopes sem timestamp, quota negada, limites de palavras e
caracteres, apresentação de requisitos, histórico na URL, dispensa/expiração de
avisos, canonical e allowlist de redirecionamento sem bootstrap público de sessão.

## QA de interface com respostas controladas

Os componentes e CSS reais foram exercitados em Chromium isolado, com identidade
e respostas de API simuladas. O ambiente de QA e suas dependências ficam fora do
repositório. Os 18 cenários finais passaram, sem exceções JavaScript nos cenários
principais. Foram verificados:

- fluxo contínuo, vazio sem mensagem de salvamento, tema sem redação, horário de
  gravação, recuperação após reload e descarte confirmado/cancelado;
- requisitos com zero palavras, limite técnico sem truncamento, botão com motivo,
  bloqueio por clique/teclado e contador com anúncio discreto;
- abas de tema por setas, troca de modo durante geração, apoio longo sem recorte
  e foco no editor após geração bem-sucedida;
- retry da correção com o mesmo `submissionId`, bloqueio da entrada durante envio
  e limpeza do rascunho após resultado salvo;
- foto acessível durante revisão, substituição confirmada, cancelamento,
  rejeição clara de HEIC e retries com a mesma foto após conexão perdida e 429;
- troca de usuário, expiração de sessão, logout explícito, envelope antigo,
  armazenamento corrompido/negado e `beforeunload` apenas para trabalho não salvo;
- histórico com voltar/avançar preservando parâmetros de assinatura, menu da conta
  com Escape/foco e navegação mobile;
- barra mobile fixa na leitura, em fluxo durante edição e sem mudar o alvo ao
  clicar em ações do editor.

A revisão em 320, 390, 768, 1024 e 1440 px não encontrou overflow horizontal.
Axe não encontrou violações A/AA nos estados de Redação exercitados nesses
viewports. Também foram exercitados paisagem, viewport de 320 × 256 para reflow,
campos de 16 px e navegação por teclado. Screenshots de 320 e 1440 px foram
inspecionados. O QA levou à correção de contraste dos links do rodapé compacto e
da mudança de posição da barra ao iniciar a extração da foto.

## Metadados e transição

O servidor Next.js local confirmou títulos sem duplicação da marca e canonical
por página. O proxy consulta o host de entrada também quando o servidor normaliza
a URL interna, com regressão para esse caso e proteção contra redirect loop.
Os callbacks sem código nos dois domínios mantêm a origem ao seguir
para a tela de erro; login e recuperação permanecem acessíveis no endereço antigo.

O domínio canônico deve estar verificado como domínio de produção do mesmo projeto,
acompanhando futuras publicações, antes da ativação do 301 público. O redirecionamento
preserva query e só aceita GET/HEAD de conteúdo público. Autenticação, áreas de
trabalho, administração, APIs e retornos de pagamentos mantêm a origem existente.

## Limites da verificação

Respostas controladas não comprovam uma correção real de Groq/Gemini, persistência
real de resultados, login completo, OAuth, entrega de e-mail ou pagamento Stripe.
Teclado virtual de aparelhos físicos e leitores de tela humanos ainda precisam
ser exercitados; árvore acessível, teclado e axe não substituem esses checks.
A verificação administrativa da allowlist de autenticação não foi concluída.
