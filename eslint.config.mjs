// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginJest from 'eslint-plugin-jest';
import configPrettier from 'eslint-plugin-prettier/recommended';

export default defineConfig(
  {
    ignores: ['**/dist/', '**/lib/', '**/node_modules/'],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: { globals: { ...globals.node }, ecmaVersion: 'latest' },
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.js'],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: { ...pluginJest.environments.globals.globals },
    },
  },
  configPrettier,
);
