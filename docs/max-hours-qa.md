# Acesso Max sem restrição de horário

Assinaturas Max com acesso vigente podem iniciar correções, gerar temas e
preparar simulados 24 horas por dia. O plano Free continua das 7h às 23h30
em `America/Sao_Paulo`; edição e recuperação de rascunhos continuam disponíveis.
A isenção de horário inclui o teste gratuito vigente e termina quando a
assinatura deixa de conceder acesso.

O servidor usa a assinatura do banco, incluindo plano, status e validade.
Flags do navegador não autorizam a isenção. Claims de redação e request IDs de
quiz são resolvidos antes de carregar plano/runtime: replay não dispara nova
IA nem depende da consulta de horário. Uma recusa de horário Free retorna 403
e libera o claim novo de redação para permitir retry posterior.

Os limites de frequência foram preservados para Free e Max: tema 3/minuto,
correção 5/minuto, preparação de quiz 5/minuto e OCR 10/hora. O OCR já não tinha
restrição de horário. Não houve mudança de schema, preço ou cobrança Stripe.

A interface recebe uma indicação SSR vinculada ao usuário e à validade do
acesso. O relógio e a assinatura são atualizados a cada minuto e no retorno à
aba. `/api/assinatura/status` inclui `userId`, permitindo descartar respostas de
outra sessão. Renovação estende a disponibilidade sem reload; cancelamento a
retira. Erros temporários mantêm somente a última indicação válida até seu
vencimento, enquanto o servidor decide cada operação.

## Verificação

- `npm run test:systems`: 172 testes passaram, incluindo status/validade Max,
  Free fora do horário, limites inalterados, replay, liberação de claim,
  expiração e parsing de respostas de assinatura.
- `npm run lint` e `npx tsc --noEmit`: passaram.
- `npm run build`: build Next.js, TypeScript e geração de sitemap passaram.
- O status de assinatura retorna 503 nas falhas temporárias de Auth e mantém
  `authenticated: false` para sessão ausente ou rejeitada. A regressão verifica
  que a falha temporária não seja apresentada como logout no polling.
- QA controlado em navegador: 11 cenários passaram, sem `pageerror` capturado.
  Cobrem Free na madrugada e durante o dia; Max na madrugada com requisições
  de tema/correção/quiz; expiração por minuto/foco/visibilidade; troca de
  usuário; validade inválida; renovação; cancelamento; erro de rede e resposta
  inválida. O harness usa os componentes atuais e simula autenticação/APIs.

Os testes não usam assinantes ou gravações de produção, nem chamadas reais de
Groq/Gemini/Stripe. A verificação de deploy deve identificar o build automático
pelo SHA e aguardar `READY`; uma preview não atualiza a produção em `main`.
