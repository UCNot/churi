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
          .indent(code => code.write())
          .write('}')
          .toText(),
      ).resolves.toBe('{\n\n}\n');
    });
    it('appends at most one new line', async () => {
      await expect(
        code
          .write('{')
          .indent(code => code.write().write('').write())
          .write('}')
          .toText(),
      ).resolves.toBe('{\n\n}\n');
    });
    it('prevents adding code fragment to itself', () => {
      expect(() => code.write(inner => inner.write(code))).toThrow(
        new TypeError('Can not insert code fragment into itself'),
      );
    });
  });

  describe('emit', () => {
    it('allows inserting code after call', async () => {
      code.write('first();');

      const record = code.emit();

      code.write('second();');

      await expect(new UccPrinter().print(record).toText()).resolves.toBe('first();\nsecond();\n');
    });
  });
});
