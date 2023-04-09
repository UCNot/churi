import { beforeEach, describe, expect, it } from '@jest/globals';
import { jsStringLiteral } from '../../impl/quote-property-key.js';
import { UccCode } from './ucc-code.js';
import { UccDeclarations } from './ucc-declarations.js';
import { UccNamespace } from './ucc-namespace.js';

describe('UccDeclarations', () => {
  let declarations: UccDeclarations;

  beforeEach(() => {
    declarations = new UccDeclarations(new UccNamespace());
  });

  describe('declare', () => {
    it('declares constant', async () => {
      expect(declarations.declare('name', 'test')).toBe('name');

      await expect(new UccCode().write(declarations).toText()).resolves.toBe(
        'const name = test;\n',
      );
    });
    it('reuses existing snippet', async () => {
      expect(declarations.declare('name', 'test1')).toBe('name');
      expect(declarations.declare('name', 'test2')).toBe('name');

      await expect(new UccCode().write(declarations).toText()).resolves.toBe(
        'const name = test1;\n',
      );
    });
    it('resolves naming conflict', async () => {
      expect(declarations.declare('name', 'test1')).toBe('name');
      expect(declarations.declare('name', 'test2', { key: 'other' })).toBe('name$0');

      await expect(new UccCode().write(declarations).toText()).resolves.toBe(
        'const name = test1;\nconst name$0 = test2;\n',
      );
    });
  });

  describe('declareClass', () => {
    it('declares class without base class', async () => {
      declarations.declareClass(
        'TestClass',
        name => code => code.write(`static className = ${jsStringLiteral(name)};`),
      );

      await expect(new UccCode().write(declarations).toText()).resolves.toBe(
        `class TestClass {\n  static className = 'TestClass';\n}\n`,
      );
    });
    it('declares multiple classes with the same name', async () => {
      expect(
        declarations.declareClass(
          'TestClass',
          name => code => code.write(`static className = ${jsStringLiteral(name)};`),
        ),
      ).toBe('TestClass');
      expect(
        declarations.declareClass(
          'TestClass',
          name => code => code.write(`static className = ${jsStringLiteral(name)};`),
        ),
      ).toBe('TestClass$0');

      await expect(new UccCode().write(declarations).toText()).resolves.toBe(
        `class TestClass {\n  static className = 'TestClass';\n}\n`
          + `class TestClass$0 {\n  static className = 'TestClass$0';\n}\n`,
      );
    });
  });
});
