import { beforeEach, describe, expect, it } from '@jest/globals';
import { printUcTokens } from '../../syntax/print-uc-token.js';
import {
  UcToken,
  UC_TOKEN_AMPERSAND,
  UC_TOKEN_ASTERISK,
  UC_TOKEN_CR,
  UC_TOKEN_CRLF,
  UC_TOKEN_PREFIX_SPACE,
  UC_TOKEN_PREFIX_TAB,
} from '../../syntax/uc-token.js';
import { appendUcToken, appendUcTokens } from './append-uc-token.js';

describe('appendUcToken', () => {
  let tokens: UcToken[];

  beforeEach(() => {
    tokens = [];
  });

  it('appends first token', () => {
    appendUcToken(tokens, 'some');

    expect(tokens).toEqual(['some']);
  });
  it('concatenates strings', () => {
    appendUcTokens(tokens, ['abc', 'def']);

    expect(tokens).toEqual(['abcdef']);
  });
  it('concatenates padded strings', () => {
    appendUcTokens(tokens, ['abc', UC_TOKEN_PREFIX_SPACE | (1 << 8), 'def']);

    expect(tokens).toEqual(['abc  def']);
  });
  it('concatenates padded strings with multiple paddings', () => {
    appendUcTokens(tokens, [
      'abc',
      UC_TOKEN_PREFIX_SPACE | (1 << 8),
      UC_TOKEN_PREFIX_TAB,
      UC_TOKEN_PREFIX_SPACE | (3 << 8),
      'def',
    ]);

    expect(tokens).toEqual(['abc  \t    def']);
  });
  it('always appends reserved token', () => {
    appendUcTokens(tokens, [UC_TOKEN_ASTERISK, UC_TOKEN_AMPERSAND]);

    expect(tokens).toEqual([UC_TOKEN_ASTERISK, UC_TOKEN_AMPERSAND]);
  });
  it('always appends after reserved', () => {
    appendUcTokens(tokens, ['abc', UC_TOKEN_AMPERSAND]);

    expect(tokens).toEqual(['abc', UC_TOKEN_AMPERSAND]);
  });
  it('always appends NL token', () => {
    appendUcTokens(tokens, [UC_TOKEN_CR, UC_TOKEN_CRLF]);

    expect(tokens).toEqual([UC_TOKEN_CR, UC_TOKEN_CRLF]);
  });
  it('always appends after NL token', () => {
    appendUcTokens(tokens, ['abc', UC_TOKEN_CRLF]);

    expect(tokens).toEqual(['abc', UC_TOKEN_CRLF]);
  });
  it('appends different padding', () => {
    appendUcTokens(tokens, [UC_TOKEN_PREFIX_TAB | (1 << 8), UC_TOKEN_PREFIX_SPACE | (3 << 8)]);

    expect(tokens).toEqual([UC_TOKEN_PREFIX_TAB | (1 << 8), UC_TOKEN_PREFIX_SPACE | (3 << 8)]);
  });
  it('concatenates paddings', () => {
    appendUcTokens(tokens, [UC_TOKEN_PREFIX_SPACE | (1 << 8), UC_TOKEN_PREFIX_SPACE | (3 << 8)]);

    expect(tokens).toEqual([UC_TOKEN_PREFIX_SPACE | (5 << 8)]);
  });
  it('concatenates long paddings', () => {
    const appended: UcToken[] = [
      UC_TOKEN_PREFIX_SPACE | (200 << 8),
      UC_TOKEN_PREFIX_SPACE | (100 << 8),
    ];

    appendUcTokens(tokens, appended);

    expect(tokens).toEqual([
      UC_TOKEN_PREFIX_SPACE | (255 << 8),
      UC_TOKEN_PREFIX_SPACE | ((300 - 255) << 8),
    ]);
    expect(printUcTokens(tokens)).toHaveLength(printUcTokens(appended).length);
  });
});
