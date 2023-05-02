import { beforeEach, describe, expect, it } from '@jest/globals';
import { jsStringLiteral } from 'httongue';
import { UccCode } from './ucc-code.js';
import { UccDeclarations } from './ucc-declarations.js';
import { UccNamespace } from './ucc-namespace.js';
import { UccOutputFormat } from './ucc-output-format.js';
import { UccPrinter } from './ucc-printer.js';

describe('UccDeclarations', () => {
  let declarations: UccDeclarations;

  beforeEach(() => {
    declarations = new UccDeclarations(new UccNamespace());
  });

  describe('declare', () => {
    it('declares constant', async () => {
      expect(declarations.declare('name', 'test')).toBe('name');

      const { body, exports } = declarations.compile();

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        'const name = test;\n',
      );
    });
    it('reuses existing snippet', async () => {
      expect(declarations.declare('name', 'test1')).toBe('name');
      expect(declarations.declare('name', 'test2')).toBe('name');

      const { body, exports } = declarations.compile();

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        'const name = test1;\n',
      );
    });
    it('resolves naming conflict', async () => {
      expect(declarations.declare('name', 'test1')).toBe('name');
      expect(declarations.declare('name', 'test2', { key: 'other' })).toBe('name$0');

      const { body, exports } = declarations.compile();

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        'const name = test1;\nconst name$0 = test2;\n',
      );
    });
    it('allows declaration when emitted', async () => {
      expect(declarations.declare('name', 'test1')).toBe('name');

      const { body, exports } = declarations.compile();

      const record = await new UccCode().write(body, exports).emit();

      declarations.declare('name2', 'test2');

      await expect(new UccPrinter().print(record).toText()).resolves.toBe(
        'const name = test1;\nconst name2 = test2;\n',
      );
    });
    it('prohibits declaration when already printed', async () => {
      expect(declarations.declare('name', 'test1')).toBe('name');

      const { body, exports } = declarations.compile();

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        'const name = test1;\n',
      );

      expect(() => declarations.declare('name2', 'test2')).toThrow(
        new TypeError('Declarations already printed'),
      );
    });
    it('(mjs) declares exported symbol', async () => {
      expect(declarations.declare('name', 'test1', { exported: true })).toBe('name');
      expect(
        declarations.declare('name2', ({ init }) => init('test2'), {
          exported: true,
        }),
      ).toBe('name2');

      const { body, exports } = declarations.compile();

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        'export const name = test1;\nexport const name2 = test2;\n',
      );
    });
    it('(IIFE) declares exported symbol', async () => {
      expect(declarations.declare('name', 'test1', { exported: true })).toBe('name');
      expect(
        declarations.declare('name2', ({ init }) => init('test2'), {
          exported: true,
        }),
      ).toBe('name2');

      const { body, exports } = declarations.compile(UccOutputFormat.IIFE);

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        'const name = test1;\nconst name2 = test2;\nreturn {\n  name,\n  name2,\n};\n',
      );
    });
    it('(mjs) renames exported symbol', async () => {
      expect(declarations.declare('name', 'test1', { key: null })).toBe('name');
      expect(declarations.declare('name', 'test2', { exported: true, key: null })).toBe('name$0');

      const { body, exports } = declarations.compile();

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        'const name = test1;\nconst name$0 = test2;\nexport {\n  name$0 as name,\n};\n',
      );
    });
    it('(IIFE) renames exported symbol', async () => {
      expect(declarations.declare('name', 'test1', { key: null })).toBe('name');
      expect(declarations.declare('name', 'test2', { exported: true, key: null })).toBe('name$0');

      const { body, exports } = declarations.compile(UccOutputFormat.IIFE);

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        'const name = test1;\nconst name$0 = test2;\nreturn {\n  name: name$0,\n};\n',
      );
    });
  });

  describe('declareClass', () => {
    it('declares class without base class', async () => {
      declarations.declareClass('TestClass', ({ name }) => code => {
        code.write(`static className = ${jsStringLiteral(name)};`);
      });

      const { body, exports } = declarations.compile();

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
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

      const { body, exports } = declarations.compile();

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        `class TestClass {\n  static className = 'TestClass';\n}\n`
          + `class TestClass$0 {\n  static className = 'TestClass$0';\n}\n`,
      );
    });
    it('declares exported class', async () => {
      declarations.declareClass(
        'TestClass',
        ({ name }) => code => {
            code.write(`static className = ${jsStringLiteral(name)};`);
          },
        { exported: true },
      );

      const { body, exports } = declarations.compile();

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        `export class TestClass {\n  static className = 'TestClass';\n}\n`,
      );
    });
  });

  describe('declareFunction', () => {
    it('declares function without args', async () => {
      expect(declarations.declareFunction('test', [], () => `return 1;`)).toBe('test');

      const { body, exports } = declarations.compile();

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        `function test() {\n  return 1;\n}\n`,
      );
    });
    it('declares function with args', async () => {
      expect(
        declarations.declareFunction('test', ['foo'], ({ args: { foo } }) => `return ${foo};`),
      ).toBe('test');

      const { body, exports } = declarations.compile();

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        `function test(foo) {\n  return foo;\n}\n`,
      );
    });
    it('declares async function', async () => {
      expect(
        declarations.declareFunction('test', [], () => `await other();`, { async: true }),
      ).toBe('test');

      const { body, exports } = declarations.compile();

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        `async function test() {\n  await other();\n}\n`,
      );
    });
    it('declares generator function', async () => {
      expect(declarations.declareFunction('test', [], () => `yield 1;`, { generator: true })).toBe(
        'test',
      );

      const { body, exports } = declarations.compile();

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        `function *test() {\n  yield 1;\n}\n`,
      );
    });
    it('declares async generator function', async () => {
      expect(
        declarations.declareFunction('test', [], () => `yield await other();`, {
          async: true,
          generator: true,
        }),
      ).toBe('test');

      const { body, exports } = declarations.compile();

      await expect(new UccCode().write(body, exports).toText()).resolves.toBe(
        `async function *test() {\n  yield await other();\n}\n`,
      );
    });
  });
});
