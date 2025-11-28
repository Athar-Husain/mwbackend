// eslintConfigPrettier.config.js
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import'; // ✅ Correct import
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
    plugins: {
      js,
      import: importPlugin, // ✅ Use the imported plugin
    },
    rules: {
      ...js.configs.recommended.rules,
      'import/no-unresolved': ['error', { caseSensitive: true }],
    },
  },
]);
