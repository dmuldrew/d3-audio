import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['dist/', 'examples/', 'coverage/', 'node_modules/']
  },
  js.configs.recommended,
  {
    rules: {
      // Audio and DOM calls are wrapped in try/catch to survive unsupported
      // browsers; those handlers deliberately ignore the error.
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  {
    // Library code runs in browsers and is also loaded by Node for tests
    files: ['src/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    }
  },
  {
    files: ['test/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ['scripts/**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node
    }
  }
];
