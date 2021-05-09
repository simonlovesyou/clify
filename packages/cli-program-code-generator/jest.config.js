module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  "transform": {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  },
  coverageReporters: ["json"]
};