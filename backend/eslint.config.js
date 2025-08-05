import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
      },
    },
    rules: {
      // Possible Errors
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'error', // Show error for undefined variables
      'no-use-before-define': [
        'error',
        { functions: false, classes: true, variables: true },
      ],

      // Best Practices
      eqeqeq: 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',

      // Stylistic Issues
      indent: ['error', 2],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-blocks': 'error',
      'keyword-spacing': 'error',
      'space-infix-ops': 'error',
      'no-trailing-spaces': 'error',
      'eol-last': 'error',

      // ES6
      'no-duplicate-imports': 'error',
      'prefer-template': 'error',
      'template-curly-spacing': 'error',

      // Node.js specific
      'no-process-exit': 'error',
      'handle-callback-err': 'error',
    },
  },
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '*.min.js',
      'pnpm-lock.yaml',
    ],
  },
];
