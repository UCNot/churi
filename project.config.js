import { ProjectConfig } from '@run-z/project-config';

export default new ProjectConfig({
  tools: {
    package: {
      exports: {
        '.': {
          source: './src/mod.ts',
          types: './dist/churi.core.d.ts',
          default: './dist/churi.core.js',
        },
        './churi.uc-value.compiler.js': {
          source: './src/compiler/deserialization/impl/uc-value.compiler.ts',
          default: './dist/churi.uc-value.compiler.js',
        },
        './churi.uri-charge.js': {
          source: './src/schema/uri-charge/impl/uri-charge.some.ts',
          default: './dist/churi.uri-charge.js',
        },
        './churi.uri-charge.compiler.js': {
          source: './src/compiler/deserialization/impl/uri-charge.compiler.ts',
          default: './dist/churi.uri-charge.compiler.js',
        },
      },
    },
  },
});
