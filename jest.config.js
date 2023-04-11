import { configureJest } from '@run-z/project-config';

export default await configureJest({
  moduleNameMapper: {
    '^churi$': '<rootDir>/src/mod.ts',
    '^churi/compiler$': '<rootDir>/src/compiler/mod.ts',
    '^churi/deserializer$': '<rootDir>/src/deserializer/mod.ts',
    '^churi/serializer$': '<rootDir>/src/serializer/mod.ts',
    '^churi/spec$': '<rootDir>/src/spec/mod.ts',
    '^#churi/uri-charge$': '<rootDir>/src/schema/uri-charge/uri-charge.impl.ts',
  },
});
