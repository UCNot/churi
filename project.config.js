import { ProjectConfig, ProjectPackage } from '@run-z/project-config';

export default new ProjectConfig({
  tools: {
    package: project => new ProjectPackage(project).extendPackageJson({
        exports: {
          '.': {
            types: './dist/churi.core.d.ts',
            default: './dist/churi.core.js',
          },
        },
      }),
  },
});
