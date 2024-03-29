import { describe, expect, it } from '@jest/globals';
import { scanUcTokens } from '../../scan-uc-tokens.js';
import {
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_DOLLAR_SIGN,
  UC_TOKEN_INSET_END,
  UC_TOKEN_INSET_URI_PARAM,
  UC_TOKEN_OPENING_PARENTHESIS,
  UcToken,
} from '../../uc-token.js';
import { UcURIParamsLexer } from './uc-uri-params.lexer.js';

describe('UcURIParamsLexer', () => {
  it('recognizes query params', () => {
    expect(scan('first=1&second=2')).toEqual([
      'first',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET_URI_PARAM,
      '1',
      UC_TOKEN_INSET_END,
      UC_TOKEN_CLOSING_PARENTHESIS,
      'second',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET_URI_PARAM,
      '2',
      UC_TOKEN_INSET_END,
      UC_TOKEN_CLOSING_PARENTHESIS,
    ]);
  });
  it('recognizes matrix params', () => {
    expect(scanMatrix('first=1;second=2')).toEqual([
      'first',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET_URI_PARAM,
      '1',
      UC_TOKEN_INSET_END,
      UC_TOKEN_CLOSING_PARENTHESIS,
      'second',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET_URI_PARAM,
      '2',
      UC_TOKEN_INSET_END,
      UC_TOKEN_CLOSING_PARENTHESIS,
    ]);
  });
  it('recognizes empty params', () => {
    expect(scan('')).toEqual([UC_TOKEN_DOLLAR_SIGN]);
    expect(scan('&&')).toEqual([UC_TOKEN_DOLLAR_SIGN]);
  });
  it('recognizes URI-encoded key split across chunks', () => {
    expect(scan('ab+', 'cd=123')).toEqual([
      'ab cd',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET_URI_PARAM,
      '123',
      UC_TOKEN_INSET_END,
      UC_TOKEN_CLOSING_PARENTHESIS,
    ]);
    expect(scan('ab%', '20cd=123')).toEqual([
      'ab cd',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET_URI_PARAM,
      '123',
      UC_TOKEN_INSET_END,
      UC_TOKEN_CLOSING_PARENTHESIS,
    ]);
  });
  it('recognizes value split across chunks', () => {
    expect(scan('a=', 'cd=1%23', '=456')).toEqual([
      'a',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET_URI_PARAM,
      'cd=1%23',
      '=456',
      UC_TOKEN_INSET_END,
      UC_TOKEN_CLOSING_PARENTHESIS,
    ]);
  });
  it('recognizes parameter without value', () => {
    expect(scan('a&b&', '&&c')).toEqual([
      'a',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_CLOSING_PARENTHESIS,
      'b',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_CLOSING_PARENTHESIS,
      'c',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_CLOSING_PARENTHESIS,
    ]);
  });
  it('recognizes empty parameter name', () => {
    expect(scan('=a', '&=', 'b')).toEqual([
      UC_TOKEN_DOLLAR_SIGN,
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET_URI_PARAM,
      'a',
      UC_TOKEN_INSET_END,
      UC_TOKEN_CLOSING_PARENTHESIS,
      UC_TOKEN_DOLLAR_SIGN,
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET_URI_PARAM,
      'b',
      UC_TOKEN_INSET_END,
      UC_TOKEN_CLOSING_PARENTHESIS,
    ]);
  });

  function scan(...input: string[]): UcToken[] {
    return scanUcTokens(emit => new UcURIParamsLexer(emit), ...input);
  }

  function scanMatrix(...input: string[]): UcToken[] {
    return scanUcTokens(emit => new UcURIParamsLexer(emit, ';'), ...input);
  }
});
