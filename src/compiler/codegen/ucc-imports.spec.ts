import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccCode } from './ucc-code.js';
import { UccImports } from './ucc-imports.js';
import { UccNamespace } from './ucc-namespace.js';

describe('UccImports', () => {
  let imports: UccImports;

  beforeEach(() => {
    imports = new UccImports(new UccNamespace());
  });

  describe('asStatic', () => {
    it('declares import', async () => {
      expect(imports.import('test-module', 'test')).toBe('test');

      await expect(new UccCode().write(imports.asStatic()).toText()).resolves.toBe(
        `import { test } from 'test-module';\n`,
      );
    });
    it('does not duplicate imports', async () => {
      expect(imports.import('test-module', 'test')).toBe('test');
      expect(imports.import('test-module', 'test')).toBe('test');

      await expect(new UccCode().write(imports.asStatic()).toText()).resolves.toBe(
        `import { test } from 'test-module';\n`,
      );
    });
    it('resolves conflicts', async () => {
      expect(imports.import('test-module1', 'test')).toBe('test');
      expect(imports.import('test-module2', 'test')).toBe('test$0');

      await expect(new UccCode().write(imports.asStatic()).toText()).resolves.toBe(
        `import { test } from 'test-module1';\nimport { test as test$0 } from 'test-module2';\n`,
      );
    });
    it('joins imports from the same module', async () => {
      expect(imports.import('test-module', 'test1')).toBe('test1');
      expect(imports.import('test-module', 'test2')).toBe('test2');

      await expect(new UccCode().write(imports.asStatic()).toText()).resolves.toBe(
        `import {\n  test1,\n  test2,\n} from 'test-module';\n`,
      );
    });
  });

  describe('asDynamic', () => {
    it('declares import', async () => {
      expect(imports.import('test-module', 'test')).toBe('test');

      await expect(new UccCode().write(imports.asDynamic()).toText()).resolves.toBe(
        `const { test } = await import('test-module');\n`,
      );
    });
    it('does not duplicate imports', async () => {
      expect(imports.import('test-module', 'test')).toBe('test');
      expect(imports.import('test-module', 'test')).toBe('test');

      await expect(new UccCode().write(imports.asDynamic()).toText()).resolves.toBe(
        `const { test } = await import('test-module');\n`,
      );
    });
    it('resolves conflicts', async () => {
      expect(imports.import('test-module1', 'test')).toBe('test');
      expect(imports.import('test-module2', 'test')).toBe('test$0');

      await expect(new UccCode().write(imports.asDynamic()).toText()).resolves.toBe(
        `const { test } = await import('test-module1');\nconst { test: test$0 } = await import('test-module2');\n`,
      );
    });
    it('joins imports from the same module', async () => {
      expect(imports.import('test-module', 'test1')).toBe('test1');
      expect(imports.import('test-module', 'test2')).toBe('test2');

      await expect(new UccCode().write(imports.asDynamic()).toText()).resolves.toBe(
        `const {\n  test1,\n  test2,\n} = await import('test-module');\n`,
      );
    });
  });
});
