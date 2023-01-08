import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccAliases } from './ucc-aliases.js';
import { UccCode } from './ucc-code.js';
import { UccImports } from './ucc-imports.js';

describe('UccImports', () => {
  let imports: UccImports;

  beforeEach(() => {
    imports = new UccImports(new UccAliases());
  });

  describe('asStatic', () => {
    it('declares import', () => {
      expect(imports.import('test-module', 'test')).toBe('test');

      expect(new UccCode().write(imports.asStatic()).toString()).toBe(
        `import { test } from 'test-module';\n`,
      );
    });
    it('does not duplicate imports', () => {
      expect(imports.import('test-module', 'test')).toBe('test');
      expect(imports.import('test-module', 'test')).toBe('test');

      expect(new UccCode().write(imports.asStatic()).toString()).toBe(
        `import { test } from 'test-module';\n`,
      );
    });
    it('resolves conflicts', () => {
      expect(imports.import('test-module1', 'test')).toBe('test');
      expect(imports.import('test-module2', 'test')).toBe('test$0');

      expect(new UccCode().write(imports.asStatic()).toString()).toBe(
        `import { test } from 'test-module1';\nimport { test as test$0 } from 'test-module2';\n`,
      );
    });
    it('joins imports from the same module', () => {
      expect(imports.import('test-module', 'test1')).toBe('test1');
      expect(imports.import('test-module', 'test2')).toBe('test2');

      expect(new UccCode().write(imports.asStatic()).toString()).toBe(
        `import {\n  test1,\n  test2,\n} from 'test-module';\n`,
      );
    });
  });

  describe('asDynamic', () => {
    it('declares import', () => {
      expect(imports.import('test-module', 'test')).toBe('test');

      expect(new UccCode().write(imports.asDynamic()).toString()).toBe(
        `const { test } = await import('test-module');\n`,
      );
    });
    it('does not duplicate imports', () => {
      expect(imports.import('test-module', 'test')).toBe('test');
      expect(imports.import('test-module', 'test')).toBe('test');

      expect(new UccCode().write(imports.asDynamic()).toString()).toBe(
        `const { test } = await import('test-module');\n`,
      );
    });
    it('resolves conflicts', () => {
      expect(imports.import('test-module1', 'test')).toBe('test');
      expect(imports.import('test-module2', 'test')).toBe('test$0');

      expect(new UccCode().write(imports.asDynamic()).toString()).toBe(
        `const { test } = await import('test-module1');\nconst { test: test$0 } = await import('test-module2');\n`,
      );
    });
    it('joins imports from the same module', () => {
      expect(imports.import('test-module', 'test1')).toBe('test1');
      expect(imports.import('test-module', 'test2')).toBe('test2');

      expect(new UccCode().write(imports.asDynamic()).toString()).toBe(
        `const {\n  test1,\n  test2,\n} = await import('test-module');\n`,
      );
    });
  });
});
