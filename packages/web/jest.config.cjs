/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        module: 'ESNext',
        moduleResolution: 'bundler',
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        paths: {
          '@/*': ['./src/*'],
          '@milestone/shared': ['../shared/dist/index.d.ts'],
        },
        rootDir: '.',
      },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@milestone/shared$': '<rootDir>/../shared/dist/index.js',
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
}
