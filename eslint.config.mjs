import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: ['.next/**/*', 'node_modules/**/*', 'supabase/.temp/**/*'],
  },
  ...nextVitals,
];

export default config;
