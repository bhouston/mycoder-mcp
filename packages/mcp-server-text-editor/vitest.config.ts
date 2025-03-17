import { defineConfig, mergeConfig } from 'vitest/config';
import rootConfig from '../../vitest.config';

export default mergeConfig(
  rootConfig,
  defineConfig({
    test: {
      coverage: {
        exclude: ['**/node_modules/**', '**/dist/**', '**/test/**', '*.config.*'],
      },
    },
  }),
);
