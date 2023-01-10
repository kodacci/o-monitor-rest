/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageReporters: ['text', 'html'],
  coverageDirectory: './coverage',
  forceExit: true,
  maxConcurrency: 1,
  maxWorkers: 1,
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 95,
      lines: 100,
      statements: 95,
    },
  },
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '@api/(.*)': '<rootDir>/src/api/$1',
    '@application/(.*)': '<rootDir>/src/application/$1',
    '@modules/(.*)': '<rootDir>/src/modules/$1',
  },
}
