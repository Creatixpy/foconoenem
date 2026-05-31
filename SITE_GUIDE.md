# Guia do Foco no ENEM

Este guia explica como o Foco no ENEM funciona, quem ele tenta ajudar e como pessoas podem contribuir com o projeto de forma responsavel.

## Proposito

O Foco no ENEM e uma plataforma de estudo para estudantes que se preparam para o Exame Nacional do Ensino Medio. A ideia central e reduzir atrito: o estudante entra, pratica redacao, resolve questoes, acompanha resultados e consulta noticias relevantes sem precisar montar tudo manualmente.

O projeto prioriza:

- acesso simples a pratica de redacao e simulados
- feedback rapido para orientar o proximo estudo
- noticias resumidas e ligadas ao ENEM
- privacidade clara e coleta minima para funcionamento
- codigo aberto para auditoria, colaboracao e evolucao do produto

## Como o site funciona

O site e uma aplicacao Next.js com frontend e backend no mesmo repositorio. As paginas vivem em `app/` e as APIs ficam em `app/api/`. O Supabase cuida de autenticacao e banco de dados, enquanto provedores externos sao usados para IA, pagamentos, OCR e noticias.

Fluxo geral:

1. O visitante acessa paginas publicas como inicio, noticias, sobre, termos e privacidade.
2. O usuario cria conta ou entra com Supabase Auth para usar areas com historico pessoal.
3. As paginas protegidas validam o usuario no servidor antes de carregar dados sensiveis.
4. As APIs recebem a requisicao, validam origem, autenticacao, limites de uso e dados de entrada.
5. Quando necessario, o servidor chama IA, Stripe, NewsAPI ou Gemini.
6. Os resultados importantes sao gravados no Supabase para consulta posterior.

Cookies essenciais sao usados para sessao, autenticacao e seguranca. Metricas opcionais da Vercel so devem carregar depois do consentimento no banner de cookies.

## Principais areas

### Redacao

A area de redacao ajuda o estudante a praticar textos no estilo ENEM.

O usuario pode:

- gerar um tema
- usar textos de apoio
- enviar a redacao
- receber avaliacao por competencias
- consultar resultados antigos
- usar OCR para extrair texto de uma imagem, quando configurado

O backend valida tamanho, tema, autenticacao, horario de funcionamento e limite de requisicoes antes de chamar IA.

### Questoes

A area de questoes monta simulados com disciplinas do ENEM e salva o desempenho do usuario autenticado.

O backend recalcula acertos, erros, nao respondidas e pontuacao antes de persistir o resultado. Isso evita confiar apenas nos numeros enviados pelo navegador.

### Noticias

A area de noticias apresenta conteudo aprovado e armazenado no banco. Ela inclui feed publico, busca textual, pagina de detalhe e busca com IA baseada no acervo ja aprovado.

O painel admin permite importar, moderar e destacar noticias. O acesso admin depende de `ADMIN_ALLOWED_EMAILS`.

### Conta

A area de conta mostra estatisticas, dados de perfil, plano atual e opcoes de gerenciamento.

A exclusao de conta exige autenticacao e confirmacao por senha quando a conta suporta login por email. Antes de apagar o usuario no Supabase Auth, o app remove dados proprios vinculados ao usuario.

### Assinatura Max e doacoes

O plano Max usa Stripe Checkout e portal do cliente. O webhook do Stripe sincroniza eventos de assinatura e doacao com validacao de assinatura.

Doacoes tambem usam Checkout Sessions e trilha de eventos para auditoria.

## Como o site ajuda estudantes

O Foco no ENEM deve ajudar sem prometer resultado garantido. A plataforma serve como apoio de estudo, nao como substituto de professor, escola ou preparacao completa.

Boas formas de usar:

- praticar redacao com frequencia
- revisar comentarios por competencia
- resolver questoes e identificar disciplinas fracas
- acompanhar noticias que podem afetar estudos, provas e calendario
- manter historico para enxergar progresso

O feedback de IA deve ser tratado como orientacao inicial. Quando possivel, estudantes devem comparar esse feedback com materiais oficiais, professores e correcoes humanas.

## Como ajudar pessoas usando o projeto

Quem quiser ajudar estudantes pode contribuir de varias formas:

- explicar que a ferramenta e apoio de estudo, nao garantia de nota
- orientar estudantes a revisar feedbacks com pensamento critico
- reportar erros de conteudo, bugs ou respostas confusas
- sugerir melhorias de acessibilidade, clareza e desempenho
- ajudar a validar fluxos em celular, conexoes lentas e navegadores comuns
- contribuir com textos, exemplos e documentacao tecnica
- apoiar financeiramente pela pagina de doacao quando fizer sentido

Ao ajudar alguem, evite pedir senha, token, dados de pagamento ou informacoes pessoais desnecessarias. Para suporte publico, use apenas o email `creatixpy@gmail.com`.

## Como contribuir com codigo

Antes de alterar codigo, entenda a area afetada e mantenha a mudanca pequena.

Boas praticas:

- siga os padroes ja usados nos arquivos tocados
- nao importe codigo server-only em componentes client
- valide entrada de APIs com schemas ou checagens explicitas
- mantenha rotas mutaveis protegidas por origem confiavel
- preserve rate limits em fluxos caros de IA, OCR e pagamentos
- nao grave segredos, `.env.local`, logs privados ou configuracoes locais
- atualize documentacao quando mudar rotas, APIs, variaveis de ambiente ou arquitetura operacional

Validacao minima para mudancas nao triviais:

```bash
npm run lint
npm run build
npm run verify:open-source
```

Quando a mudanca envolver historico publicavel, tambem rode:

```bash
npm run verify:history-clean
```

## Como contribuir com conteudo e produto

Contribuicoes de conteudo devem ser claras, verificaveis e uteis para estudantes.

Priorize:

- linguagem simples
- exemplos ligados ao ENEM
- explicacoes sem sensacionalismo
- dados ou referencias quando houver afirmacoes factuais
- cuidado para nao expor dados pessoais de estudantes

Evite:

- promessas de aprovacao ou nota
- conteudo copiado sem permissao
- noticias sem fonte confiavel
- temas muito vagos que nao ajudam a argumentar
- orientacoes que incentivem burlar regras de prova ou plataforma

## Privacidade e seguranca

O projeto deve coletar apenas o necessario para conta, seguranca, funcionamento, historico de estudo, pagamentos e recursos solicitados pelo usuario.

Pontos importantes:

- emails profissionais do dominio `foconoenem.com` nao devem ser usados enquanto o projeto nao tiver dominio proprio e caixa configurada
- o email publico atual e `creatixpy@gmail.com`
- dados de cartao nao sao armazenados pelo app
- chaves privilegiadas devem ficar somente no servidor
- metricas opcionais dependem de consentimento
- vulnerabilidades nao devem ser reportadas por issue publica

Relatorios de seguranca devem seguir `SECURITY.md`.

## Estado de publicacao open source

A arvore atual do projeto tem verificacao propria para arquivos publicaveis:

```bash
npm run verify:open-source
```

O historico Git tambem precisa estar limpo para uma publicacao completamente segura:

```bash
npm run verify:history-clean
```

Se o historico contiver segredos antigos ou configuracoes privadas, a opcao mais segura e publicar a partir de uma arvore limpa gerada por:

```bash
npm run release:public-tree
```

Consulte `OPEN_SOURCE_RELEASE.md` antes de tratar uma copia como release publico final.

