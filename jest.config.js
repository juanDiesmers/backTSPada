module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  // Print individual test results and console logs
  verbose: true,
  // Increase timeout for slower environments
  testTimeout: 10000
};
