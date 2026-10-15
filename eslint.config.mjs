// ESLint (flat config) : TypeScript + regles Next, et interdit d'importer
// le code back (src/server) depuis le front. Le back ne doit etre joignable
// que via l'API et les contrats partages (src/contracts).

import eslint from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'out/**',
      'coverage/**',
      'node_modules/**',
      'next-env.d.ts',
      'public/mockServiceWorker.js',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // Le back manipule des flux Web/Node et un route handler générique : `any`
    // y est parfois nécessaire. Le front reste strict.
    files: [
      'src/server/**/*.{ts,tsx}',
      'src/app/api/**/*.{ts,tsx}',
      'tests/**/*.{ts,tsx}',
      'scripts/**/*.{ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: [
      'src/app/**/*.{ts,tsx}',
      'src/components/**/*.{ts,tsx}',
      'src/features/**/*.{ts,tsx}',
      'src/lib/**/*.{ts,tsx}',
    ],
    ignores: ['src/app/api/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/server', '@/server/*'],
              message:
                "src/server est reserve au back : importez uniquement les contrats (@/contracts) et passez par l'API.",
            },
          ],
        },
      ],
    },
  },
);