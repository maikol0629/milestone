export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@milestone/shared$': '<rootDir>/../../shared/dist/index.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
}
