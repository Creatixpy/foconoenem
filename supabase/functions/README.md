# Edge Functions Legadas

O runtime atual do projeto nao depende de Supabase Edge Functions.
Este diretorio local existe apenas para registrar esse estado e nao contem codigo ativo de Edge Function.

Integracoes que antes passaram por Edge Functions agora rodam diretamente nas rotas do Next.js:

- IA e geracao de conteudo: `app/api/corrigir`, `app/api/gerar-tema`, `app/api/questoes`, `app/api/noticias/gpt-busca`
- Checkout e webhook do Stripe: `app/api/doacao/checkout`, `app/api/doacao/webhook`
- Horario de funcionamento: `app/api/schedule/time`

Auditoria mais recente: 2026-04-28.

Funcoes remotas encontradas no projeto Supabase:

- `groq-proxy`
- `stripe-checkout`
- `schedule-proxy`

Nenhuma dessas funcoes possui referencia no codigo atual do repositorio.
Os logs do servico de Edge Functions vieram vazios nas ultimas 24 horas durante a auditoria.

No projeto remoto `wywcpbgipufylnaauewe`, essas funcoes foram neutralizadas em 2026-04-28 com stubs `410 Gone` e `verify_jwt=true`.
Elas continuam listadas como `ACTIVE` somente porque a exclusao via CLI exige `SUPABASE_ACCESS_TOKEN` ou acao manual no dashboard.
Se precisar remover definitivamente, apague-as no dashboard do Supabase ou execute `supabase functions delete <slug> --project-ref wywcpbgipufylnaauewe` com um token de acesso valido.

Nao adicione novas Edge Functions aqui sem uma decisao explicita de voltar a usar essa arquitetura.
