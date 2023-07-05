import { configureJest } from '@run-z/project-config';

export default await configureJest({
  moduleNameMapper: {
    '^churi$': '<rootDir>/src/mod.ts',
    '^churi/compiler.js$': '<rootDir>/src/compiler/mod.ts',
    '^churi/deserializer.js$': '<rootDir>/src/deserializer/mod.ts',
    '^churi/deserializer/defaults.js$': '<rootDir>/dist/churi.deserializer.defaults.js',
    '^churi/deserializer/meta.js$': '<rootDir>/dist/churi.deserializer.meta.js',
    '^churi/serializer.js$': '<rootDir>/src/serializer/mod.ts',
    '^churi/validator.js$': '<rootDir>/src/validator/mod.ts',
    '^#churi/spec.js$': '<rootDir>/src/spec/mod.ts',
    '^#churi/uc-value/deserializer.js$': '<rootDir>/dist/churi.uc-value.deserializer.js',
    '^#churi/uri-charge.js$': '<rootDir>/src/schema/uri-charge/impl/uri-charge.some.ts',
  },
});
