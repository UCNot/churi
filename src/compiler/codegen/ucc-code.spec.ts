import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccCode } from './ucc-code.js';
import { UccPrinter } from './ucc-printer.js';

describe('UccCode', () => {
  let code: UccCode;

  beforeEach(() => {
    code = new UccCode();
  });

  describe('none', () => {
    it('produces no code', async () => {
      await expect(new UccCode().write(UccCode.none).toText()).resolves.toBe('');
    });
  });

  describe('write', () => {
    it('appends new line without indentation', async () => {
      await expect(
        code
          .write('{')
          .indent(code => {
            code.write();
          })
          .write('}')
          .toText(),
      ).resolves.toBe('{\n}\n');
    });
    it('appends at most one new line', async () => {
      await expect(
        code
          .write('{')
          .indent(code => {
            code.write().write('').write();
          })
          .write('}')
          .toText(),
      ).resolves.toBe('{\n\n}\n');
    });
    it('prevents adding code fragment to itself', async () => {
      code.write(inner => {
        inner.write(code);
      });

      await expect(code.toText()).rejects.toThrow(
        new TypeError('Can not insert code fragment into itself'),
      );
    });
  });

  describe('inline', () => {
    it('joins lines', async () => {
      await expect(
        code
          .write('{')
          .indent(code => {
            code
              .write('{')
              .indent(code => {
                code.inline(code => {
                  code.write('foo();', 'bar();');
                });
              })
              .write('}');
          })
          .write('}')
          .toText(),
      ).resolves.toBe('{\n  {\n    foo();bar();\n  }\n}\n');
    });
  });

  describe('indent inside inline', () => {
    it('respects outer indentation', async () => {
      await expect(
        code
          .write('const test = {')
          .indent(code => {
            code.inline(
              'a: ',
              '{',
              code => {
                code.indent('foo: 1,', 'bar: 2,', '');
              },
              '},',
            );
          })
          .write('};')
          .toText(),
      ).resolves.toBe('const test = {\n  a: {\n    foo: 1,\n    bar: 2,\n  },\n};\n');
    });
  });

  describe('block inside inline', () => {
    it('respects outer indentation only', async () => {
      await expect(
        code
          .write('const test = {')
          .indent(code => {
            code.inline(
              'a: ',
              '{',
              code => {
                code.block('foo: 1,', 'bar: 2');
              },
              '},',
            );
          })
          .write('};')
          .toText(),
      ).resolves.toBe('const test = {\n  a: {foo: 1,\n  bar: 2},\n};\n');
    });
  });

  describe('emit', () => {
    it('allows inserting code after call', async () => {
      code.write('first();');

      const record = await code.emit();

      code.write('second();');

      await expect(new UccPrinter().print(record).toText()).resolves.toBe('first();\nsecond();\n');
      await expect(new UccPrinter().print(record).toText()).resolves.toBe('first();\nsecond();\n');
    });
    it('prevents inserting code after print', async () => {
      code.write('first();');

      const record = await code.emit();

      await expect(new UccPrinter().print(record).toText()).resolves.toBe('first();\n');

      expect(() => code.write('second();')).toThrow(new TypeError('Code printed already'));
    });
  });
});
