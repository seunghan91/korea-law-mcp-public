import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Skip native module imports in unit tests
  moduleNameMapper: {
    '^@markdown-media/core$': '<rootDir>/src/__tests__/__mocks__/markdown-media-core.ts',
  },
};

export default config;
