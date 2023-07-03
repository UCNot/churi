import { describe, expect, it } from '@jest/globals';
import {
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_EXCLAMATION_MARK,
  UC_TOKEN_OPENING_PARENTHESIS,
} from '../../syntax/uc-token.js';
import { UcFormatted } from './uc-formatted.js';

describe('UcFormatted', () => {
  it('has string tag', () => {
    expect(new UcFormatted('test', ['foo'])[Symbol.toStringTag]).toBe('UcFormattedData');
  });

  describe('toString', () => {
    it('builds string representation', () => {
      expect(
        new UcFormatted('test', [
          UC_TOKEN_OPENING_PARENTHESIS,
          'Hello',
          UC_TOKEN_EXCLAMATION_MARK,
          UC_TOKEN_CLOSING_PARENTHESIS,
        ]).toString(),
      ).toBe("!test'(Hello!)");
    });
  });
});
