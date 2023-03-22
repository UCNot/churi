import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccCode } from './ucc-code.js';
import { UccPrinter } from './ucc-printer.js';

describe('UccCode', () => {
  let code: UccCode;

  beforeEach(() => {
    code = new UccCode();
  });

  describe('write', () => {
    it('appends new line without indentation', () => {
      expect(
        code
          .write('{')
          .indent(code => code.write())
          .write('}')
          .toString(),
      ).toBe('{\n}\n');
    });
    it('appends at most one new line', () => {
      expect(
        code
          .write('{')
          .indent(code => code.write().write('').write())
          .write('}')
          .toString(),
      ).toBe('{\n\n}\n');
    });
    it('prevents adding code fragment to itself', () => {
      expect(() => code.write(inner => inner.write(code))).toThrow(
        new TypeError('Can not insert code fragment into itself'),
      );
    });
  });

  describe('prePrint', () => {
    it('allows inserting code after call', () => {
      code.write('first();');

      const record = code.prePrint();

      code.write('second();');

      expect(new UccPrinter().print(record).toString()).toBe('first();\nsecond();\n');
    });
  });
});
