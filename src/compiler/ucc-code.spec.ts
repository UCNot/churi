import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccCode } from './ucc-code.js';

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
      ).toBe('{\n\n}\n');
    });
    it('prevents adding code fragment to itself', () => {
      expect(() => code.write(inner => inner.write(code))).toThrow(
        new TypeError('Can not insert code fragment into itself'),
      );
    });
  });
});
