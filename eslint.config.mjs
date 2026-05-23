// Flat ESLint config — workspace genelinde tek konfig.
// Backend (Node/Express) ve frontend (React/Vite) için ayrı override'lar.
// Part 1 hedefi: davranış değişikliği YOK; sadece statik analiz baseline'ı.
// Otomatik düzeltme yapılmıyor; ihlaller warning olarak raporlanıyor.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Global ignore
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      'frontend/public/**',
      'backend/dist/**',
      'frontend/dist/**',
      // SQL ve declaration dosyaları
      'backend/src/**/*.sql',
      '**/*.d.ts',
    ],
  },

  // Temel JS önerileri
  js.configs.recommended,

  // TypeScript: tip-aware kuralları KAPALI (project parser olmadan hızlı baseline).
  // Tip kontrolü zaten tsc --noEmit ile yapılıyor.
  ...tseslint.configs.recommended,

  // Backend katmanı (Node)
  {
    files: ['backend/src/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'module',
      ecmaVersion: 2022,
    },
    rules: {
      // Route'larda console -> logger geçişi Part 2'de mekanik yapılacak.
      'no-console': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-floating-promises': 'off',
      // Express Request/Application augmentation için global namespace deseni
      '@typescript-eslint/no-namespace': 'off',
      // ts-ignore yorumları için warning seviyesi (Part 2/3'te ts-expect-error'a çevrilebilir)
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  },

  // Backend bootstrap + startup + scaffolding: console serbest (intentional stdout)
  {
    files: [
      'backend/src/server.ts',
      'backend/src/db.ts',
      'backend/src/bootstrap/**/*.ts',
      'backend/src/scripts/**/*.ts',
      // Part 2'de taşınana kadar mevcut konumlardaki scaffolding script'leri:
      'backend/src/createTables.ts',
      'backend/src/createAdminTable.ts',
      'backend/src/createSahaTables.ts',
      'backend/src/createTestUser.ts',
      'backend/src/createUrunlerTable.ts',
      'backend/src/initLocations.ts',
      'backend/src/fetchLocations.ts',
      'backend/src/add*.ts',
      'backend/src/check*.ts',
      'backend/src/fix*.ts',
      'backend/src/generate*.ts',
      'backend/src/make*.ts',
      'backend/src/migrate*.ts',
      'backend/src/reset*.ts',
      'backend/src/run*.ts',
      'backend/src/test*.ts',
      'backend/src/update*.ts',
    ],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Frontend katmanı (React + TS)
  {
    files: ['frontend/src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2022 },
      sourceType: 'module',
      ecmaVersion: 2022,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // React 17+ JSX transform
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'warn',
      // Türkçe metinlerde tırnak/apostrof çok yaygın — warning olarak kalsın
      'react/no-unescaped-entities': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-console': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // ban-ts-comment frontend tarafında da warn (utils/excel.ts dokunulmaz)
      '@typescript-eslint/ban-ts-comment': 'warn',
      // react-hooks v6 react-compiler kuralları: davranış değiştirmeden uyarı kalsın
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
  {
    files: ['**/vite.config.ts', '**/vite.config.js', '**/*.config.{js,ts,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Kök dizindeki CommonJS dev/launcher script'leri (örn. index.js)
  {
    files: ['index.js', '*.cjs'],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'commonjs',
      ecmaVersion: 2022,
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // Prettier ile çakışan stil kurallarını devre dışı bırak — EN SONDA olmalı
  prettierConfig,
);
