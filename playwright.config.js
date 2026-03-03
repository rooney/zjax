import { globSync as findFiles } from 'node:fs';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['list'],
    ['monocart-reporter', {
      coverage: {
        reports: ['v8', 'text', 'text-summary', 'lcovonly'],
        entryFilter: _ => _.url.startsWith('http://localhost:3000/src'),
        sourcePath: (path) => findFiles(`src/**/${path}`)[0] ?? path,
      },
    }],
    ['./tests/test-utils.js'],
  ]
});
