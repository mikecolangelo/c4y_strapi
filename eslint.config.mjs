import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist.old/**',
      'dist.old.admin/**',
      'build/**',
      '.cache/**',
      '.strapi/**',
      'node_modules/**',
      'types/generated/**',
      'public/**',
      'src/extensions/documentation/documentation/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Strapi injects a global `strapi` instance and runs on Node.
  {
    languageOptions: {
      globals: {
        ...globals.node,
        strapi: 'readonly',
      },
    },
  },

  // Flag unused imports/variables; relax `any` to a warning for gradual cleanup.
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Disable stylistic rules that conflict with Prettier (Prettier owns format).
  eslintConfigPrettier
);
