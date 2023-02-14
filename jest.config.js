import { configureJest } from '@run-z/project-config';

export default await configureJest({
  collectCoverage: false,
  moduleNameMapper: {
    '^@hatsy/churi/deserializer$': '<rootDir>/src/deserializer/mod.ts',
    '^@hatsy/churi/serializer$': '<rootDir>/src/serializer/mod.ts',
    '^@hatsy/churi/spec$': '<rootDir>/src/spec/mod.ts',
  },
});
