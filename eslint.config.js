// eslint.config.js
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', 'src/generated/**'],
  },
  {
    files: ['src/**/*.ts'],
    extends: [tseslint.configs.recommended, prettierConfig],
  },
);
