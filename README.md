# Foco no ENEM - Simulado de Redação

Este é um projeto [Next.js](https://nextjs.org) que oferece um simulado de redação do ENEM com correção automatizada usando inteligência artificial.

## Configuração

### Pré-requisitos

- Node.js 18.17.0 ou superior
- Uma conta na [Groq](https://groq.com) para obter a API key

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```
GROQ_API_KEY=sua-api-key-aqui
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
- Groq API (LLaMA 3.1 70B Versatile)

## Aprender Mais

Para saber mais sobre as tecnologias utilizadas, consulte:

- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Groq](https://docs.groq.com/)
