import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: ['.next/**/*', '.vercel/**/*', 'node_modules/**/*', 'supabase/.temp/**/*'],
  },
  ...nextVitals,
];

export default config;
