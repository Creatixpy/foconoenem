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
# Groq API (para correção de redações e geração de questões)
GROQ_API_KEY=sua-api-key-aqui

# Supabase (banco de dados)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
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
5. **quiz_results** - Resultados de simulados de questões
6. **noticias** - Sistema de notícias educacionais

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
- Sistema disponível das 7h às 22h
- Controle de custos de API
- Mensagens informativas fora do horário

### Analytics
- Rastreamento de eventos importantes
- Métricas de uso e performance
- Suporte a decisões baseadas em dados

## Aprender Mais

Para saber mais sobre as tecnologias utilizadas, consulte:

- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Groq](https://docs.groq.com/)
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do TailwindCSS](https://tailwindcss.com/docs)
