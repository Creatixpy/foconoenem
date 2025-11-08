# Foco no ENEM - Simulado de Redação

Este é um projeto [Next.js](https://nextjs.org) que oferece um simulado de redação do ENEM com correção automatizada usando inteligência artificial.

## Configuração

### Pré-requisitos

- Node.js 18.17.0 ou superior
- Uma conta na [Groq](https://groq.com) para obter a API key
- Uma conta no [Supabase](https://supabase.com) para o banco de dados

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```bash
# Groq API (correção/redação/questões/notícias)
GROQ_API_KEY=sua-api-key-aqui
GROQ_MODEL=openai/gpt-oss-120b
# (Opcional) chave/modelo secundário para fallback automático quando houver rate limit
GROQ_FALLBACK_API_KEY=sua-chave-secundaria
GROQ_FALLBACK_MODEL=llama3-70b-8192
# Número máximo de tentativas por provedor antes de acionar o próximo
GROQ_MAX_ATTEMPTS=2

# Supabase (banco de dados)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# NewsAPI (importação automática de notícias)
NEWSAPI_API_KEY=sua-chave-newsapi

# Administração de destaques
ADMIN_ALLOWED_EMAILS=email1@example.com,email2@example.com
# Opcional: segredo para execuções automáticas (cron jobs)
ADMIN_CRON_SECRET=segredo-unico-para-requests-automaticas

# Edge Functions (configurar nas variáveis do Supabase, NÃO no cliente)
SUPABASE_SERVICE_ROLE_KEY=chave-service-role
```

## Primeiros Passos

Primeiro, instale as dependências:

```bash
npm install
# ou
yarn install
# ou
pnpm install
# ou
bun install
```

Em seguida, execute o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Abra [http://localhost:3000](http://localhost:3000) em seu navegador para ver o resultado.

## Funcionalidades

- Simulado de redação com tema atual
- Correção automática baseada nos critérios do ENEM
- Feedback detalhado por competência
- Análise de pontos fortes e pontos a melhorar
- Importação automática de notícias educacionais via NewsAPI (restrita ao painel administrativo)

## Tecnologias Utilizadas

- Next.js 15
- React 19
- TailwindCSS 4
- Groq API (GPT-OSS 120B)
- Supabase (PostgreSQL)
- TypeScript 5.9

## Configuração do Banco de Dados

### Estrutura de Tabelas

O projeto utiliza as seguintes tabelas no Supabase:

1. **essay_results** - Armazena correções de redações
2. **cached_themes** - Cache de temas gerados
3. **rate_limits** - Controle de rate limiting
4. **analytics_events** - Eventos de analytics
5. **configuracoes** - Preferências administrativas e marcação de atualizações
6. **user_profiles** - Perfil público e dados básicos dos usuários
7. **user_statistics** - Indicadores agregados de desempenho do usuário
8. **user_goals** - Metas personalizadas definidas pelos usuários
9. **quiz_results** - Resultados de simulados de questões
10. **noticias** - Sistema de notícias educacionais

Para mais detalhes sobre a estrutura e melhorias implementadas, consulte [MELHORIAS.md](./MELHORIAS.md).

## Funcionalidades Avançadas

### Sistema de Cache
- Reduz custos de API em 60-70%
- Temas reutilizados de forma inteligente
- Limpeza automática de cache antigo

### Rate Limiting
- Proteção contra abuso de API
- Limites configuráveis por endpoint
- Mensagens claras ao usuário

### Horário de Funcionamento
- Sistema disponível das 7h às 23h30
- Controle de custos de API
- Mensagens informativas fora do horário

### Analytics
- Rastreamento de eventos importantes
- Métricas de uso e performance
- Suporte a decisões baseadas em dados

### Edge Functions Ativas
- `generate-theme`: gera e cacheia temas de redação com a Groq API.
- `correct-essay`: corrige redações, grava resultados e expõe consulta por ID.
- `quiz-handler`: cria simulados por disciplina e salva desempenho com atualização de estatísticas.
- `update-highlights`, `remove-highlight`: administração dos destaques de notícias.
- `maintenance-cleanup`: rotina de limpeza de caches, rate limits e analytics.

Todas as rotas e funções que dependem da IA utilizam um mecanismo automático de fallback: caso o provedor principal da Groq atinja limite de requisições, o sistema tenta novamente com a chave/modelo secundário antes de retornar erro para o usuário. Configure as variáveis `GROQ_FALLBACK_API_KEY` e `GROQ_FALLBACK_MODEL` para ativar esse comportamento.

## Aprender Mais

Para saber mais sobre as tecnologias utilizadas, consulte:

- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Groq](https://docs.groq.com/)
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do TailwindCSS](https://tailwindcss.com/docs)
