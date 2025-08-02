module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/tests/**',
    '!jest.config.js'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true
};
