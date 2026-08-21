'use strict';

const globals = {
  browser: {
    window: 'readonly', document: 'readonly', location: 'readonly',
    fetch: 'readonly', URLSearchParams: 'readonly', requestAnimationFrame: 'readonly',
    cancelAnimationFrame: 'readonly', setTimeout: 'readonly', setInterval: 'readonly',
    clearTimeout: 'readonly', clearInterval: 'readonly', console: 'readonly',
    Node: 'readonly', KeyboardEvent: 'readonly',
  },
  node: {
    require: 'readonly', module: 'writable', process: 'readonly',
    __dirname: 'readonly', console: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly',
    Buffer: 'readonly', URL: 'readonly',
  },
};

module.exports = [
  {
    files: ['scripts/**/*.js', 'endpoint/**/*.js', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': 'off',
      'max-lines': ['error', { max: 250, skipBlankLines: false }],
      'no-warning-comments': ['error', { terms: ['todo', 'fixme', 'hack'] }],
    },
  },
  {
    files: ['web/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: globals.browser,
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'max-lines': ['error', { max: 250, skipBlankLines: false }],
      'no-warning-comments': ['error', { terms: ['todo', 'fixme', 'hack'] }],
    },
  },
  {
    files: ['web/js/config.js'],
    rules: { 'prefer-const': 'off' }
  },
];
