import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    ignores: ['.next/**/*', 'node_modules/**/*', 'supabase/.temp/**/*'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default config;
