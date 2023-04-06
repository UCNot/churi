import { describe, expect, it } from '@jest/globals';
import { printUcToken } from './print-uc-token.js';
import { UC_TOKEN_CRLF, UC_TOKEN_PREFIX_SPACE, UC_TOKEN_PREFIX_TAB } from './uc-token.js';

describe('printUcToken', () => {
  it('prints space paddings', () => {
    expect(printUcToken(UC_TOKEN_PREFIX_SPACE)).toBe(' ');
    expect(printUcToken(UC_TOKEN_PREFIX_SPACE + (2 << 8))).toBe('   ');
  });
  it('prints tab paddings', () => {
    expect(printUcToken(UC_TOKEN_PREFIX_TAB)).toBe('\t');
    expect(printUcToken(UC_TOKEN_PREFIX_TAB + (2 << 8))).toBe('\t\t\t');
  });
  it('prints line separators', () => {
    // expect(printUcToken(UC_TOKEN_CR)).toBe('\r');
    // expect(printUcToken(UC_TOKEN_LF)).toBe('\n');
    expect(printUcToken(UC_TOKEN_CRLF)).toBe('\r\n');
  });
  it('prints strings', () => {
    expect(printUcToken('')).toBe('');
    expect(printUcToken('a b c')).toBe('a b c');
  });
});
