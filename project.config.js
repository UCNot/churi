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
        './churi.uri-charge': {
          source: './src/schema/uri-charge/uri-charge.impl.ts',
          default: './dist/churi.uri-charge.js',
        },
        './churi.uri-charge.compiler': {
          source: './src/compiler/impl/uri-charge.compiler.ts',
          default: './dist/churi.uri-charge.compiler.js',
        },
      },
    },
  },
});
