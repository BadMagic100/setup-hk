// @ts-check

import eslint from '@eslint/js';
import globals from 'globals';
import tseslint, { config } from 'typescript-eslint';
import pluginJest from 'eslint-plugin-jest';
import configPrettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.js'],
    ignores: ['dist/', 'lib/', 'node_modules/'],
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
