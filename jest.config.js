import { configureJest } from '@run-z/project-config';

export default await configureJest({
  moduleNameMapper: {
    '^@hatsy/churi/serializer$': '<rootDir>/src/serializer/mod.ts',
    '^@hatsy/churi/spec$': '<rootDir>/src/spec/mod.ts',
  },
});
