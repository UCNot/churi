import { beforeEach, describe, expect, it } from '@jest/globals';
import { jsStringLiteral } from 'httongue';
import { UccCode } from './ucc-code.js';
import { UccDeclarations } from './ucc-declarations.js';
import { UccNamespace } from './ucc-namespace.js';
import { UccPrinter } from './ucc-printer.js';

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
    it('allows declaration when emitted', async () => {
      expect(declarations.declare('name', 'test1')).toBe('name');

      const record = await new UccCode().write(declarations).emit();

      declarations.declare('name2', 'test2');

      await expect(new UccPrinter().print(record).toText()).resolves.toBe(
        'const name = test1;\nconst name2 = test2;\n',
      );
    });
    it('prohibits declaration when already printed', async () => {
      expect(declarations.declare('name', 'test1')).toBe('name');

      await expect(new UccCode().write(declarations).toText()).resolves.toBe(
        'const name = test1;\n',
      );

      expect(() => declarations.declare('name2', 'test2')).toThrow(
        new TypeError('Declarations already printed'),
      );
    });
    it('declares exported symbol', async () => {
      expect(declarations.declare('name', 'test1', { exported: true })).toBe('name');
      expect(
        declarations.declare('name2', ({ init }) => init('test2'), {
          exported: true,
        }),
      ).toBe('name2');

      await expect(new UccCode().write(declarations).toText()).resolves.toBe(
        'export const name = test1;\nexport const name2 = test2;\n',
      );
    });
  });

  describe('declareClass', () => {
    it('declares class without base class', async () => {
      declarations.declareClass('TestClass', ({ name }) => code => {
        code.write(`static className = ${jsStringLiteral(name)};`);
      });

      await expect(new UccCode().write(declarations).toText()).resolves.toBe(
        `class TestClass {\n  static className = 'TestClass';\n}\n`,
      );
    });
    it('declares multiple classes with the same name', async () => {
      expect(
        declarations.declareClass('TestClass', ({ name }) => code => {
          code.write(`static className = ${jsStringLiteral(name)};`);
        }),
      ).toBe('TestClass');
      expect(
        declarations.declareClass('TestClass', ({ name }) => code => {
          code.write(`static className = ${jsStringLiteral(name)};`);
        }),
      ).toBe('TestClass$0');

      await expect(new UccCode().write(declarations).toText()).resolves.toBe(
        `class TestClass {\n  static className = 'TestClass';\n}\n`
          + `class TestClass$0 {\n  static className = 'TestClass$0';\n}\n`,
      );
    });
  });
});
