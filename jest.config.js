import { configureJest } from '@run-z/project-config';

export default await configureJest({
  moduleNameMapper: {
    '^churi$': '<rootDir>/src/mod.ts',
    '^churi/default-entities.js$': '<rootDir>/dist/churi.default-entities.js',
    '^churi/compiler.js$': '<rootDir>/src/compiler/mod.ts',
    '^churi/deserializer.js$': '<rootDir>/src/deserializer/mod.ts',
    '^churi/serializer.js$': '<rootDir>/src/serializer/mod.ts',
    '^#churi/spec.js$': '<rootDir>/src/spec/mod.ts',
    '^#churi/uri-charge.js$': '<rootDir>/src/schema/uri-charge/impl/uri-charge.some.ts',
  },
});
