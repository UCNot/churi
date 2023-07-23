import { describe, expect, it } from '@jest/globals';
import { scanUcTokens } from '../scan-uc-tokens.js';
import { UC_TOKEN_APOSTROPHE, UcToken } from '../uc-token.js';
import { UcURIEncodedLexer } from './uc-uri-encoded.lexer.js';

describe('UcURIEncodedLexer', () => {
  it('decodes percent-encoded entities', () => {
    expect(scan('%20')).toEqual([UC_TOKEN_APOSTROPHE, ' ']);
    expect(scan('%20a')).toEqual([UC_TOKEN_APOSTROPHE, ' a']);
    expect(scan('%20', 'a')).toEqual([UC_TOKEN_APOSTROPHE, ' a']);
    expect(scan('%2', '0a')).toEqual([UC_TOKEN_APOSTROPHE, ' a']);
    expect(scan('%', '20a')).toEqual([UC_TOKEN_APOSTROPHE, ' a']);
  });
  it('decodes percent-encoded multi-char entities', () => {
    expect(scan('%e1%9B%A4')).toEqual([UC_TOKEN_APOSTROPHE, '\u16e4']);
    expect(scan('%e1%9B%A4!')).toEqual([UC_TOKEN_APOSTROPHE, '\u16e4!']);
    expect(scan('%e1%9B%A4', '!')).toEqual([UC_TOKEN_APOSTROPHE, '\u16e4!']);
    expect(scan('%e1%9B', '%A4!')).toEqual([UC_TOKEN_APOSTROPHE, '\u16e4!']);
    expect(scan('%e1%9B%A4!')).toEqual([UC_TOKEN_APOSTROPHE, '\u16e4!']);
    expect(scan('%e1%', '9B%A4!')).toEqual([UC_TOKEN_APOSTROPHE, '\u16e4!']);
    expect(scan('%e1%9B%A4!')).toEqual([UC_TOKEN_APOSTROPHE, '\u16e4!']);
    expect(scan('%', 'e1%9', 'B%A4!')).toEqual([UC_TOKEN_APOSTROPHE, '\u16e4!']);
  });
  it('decodes non-percent-encoded chunk immediately', () => {
    expect(scan('%20a', 'bc%20d')).toEqual([UC_TOKEN_APOSTROPHE, ' a', 'bc d']);
  });
  it('decodes plus as plus by default', () => {
    expect(scan('a+b')).toEqual([UC_TOKEN_APOSTROPHE, 'a+b']);
    expect(scan('a+', 'b')).toEqual([UC_TOKEN_APOSTROPHE, 'a+', 'b']);
    expect(scan('a', '+b')).toEqual([UC_TOKEN_APOSTROPHE, 'a', '+b']);
  });
  it('decodes plus as space when requested', () => {
    expect(scanAsParam('a+b')).toEqual([UC_TOKEN_APOSTROPHE, 'a b']);
    expect(scanAsParam('a+', 'b')).toEqual([UC_TOKEN_APOSTROPHE, 'a ', 'b']);
    expect(scanAsParam('a', '+b')).toEqual([UC_TOKEN_APOSTROPHE, 'a', ' b']);
  });
  it('decodes raw text', () => {
    expect(scanUcTokens(emit => new UcURIEncodedLexer(emit, true), 'a+b')).toEqual(['a+b']);
    expect(scanUcTokens(emit => UcURIEncodedLexer.plusAsSpace(emit, true), 'a+b')).toEqual(['a b']);
  });

  function scan(...input: string[]): UcToken[] {
    return scanUcTokens(emit => new UcURIEncodedLexer(emit), ...input);
  }

  function scanAsParam(...input: string[]): UcToken[] {
    return scanUcTokens(emit => UcURIEncodedLexer.plusAsSpace(emit), ...input);
  }
});
