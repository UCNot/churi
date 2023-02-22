import { beforeEach, describe, expect, it } from '@jest/globals';
import {
  UcToken,
  UC_TOKEN_AMPERSAND,
  UC_TOKEN_APOSTROPHE,
  UC_TOKEN_ASTERISK,
  UC_TOKEN_AT_SIGN,
  UC_TOKEN_CLOSING_BRACKET,
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_COLON,
  UC_TOKEN_COMMA,
  UC_TOKEN_CR,
  UC_TOKEN_CRLF,
  UC_TOKEN_DOLLAR_SIGN,
  UC_TOKEN_EQUALS_SIGN,
  UC_TOKEN_EXCLAMATION_MARK,
  UC_TOKEN_HASH,
  UC_TOKEN_LF,
  UC_TOKEN_MASK_SPACE,
  UC_TOKEN_MASK_TAB,
  UC_TOKEN_OPENING_BRACKET,
  UC_TOKEN_OPENING_PARENTHESIS,
  UC_TOKEN_PLUS_SIGN,
  UC_TOKEN_QUESTION_MARK,
  UC_TOKEN_SEMICOLON,
  UC_TOKEN_SLASH,
} from './uc-token.js';
import { UcTokenizer } from './uc-tokenizer.js';

describe('UcTokenizer', () => {
  let tokenizer: UcTokenizer;
  let tokens: UcToken[];

  beforeEach(() => {
    tokenizer = new UcTokenizer(token => {
      tokens.push(token);
    });
    tokens = [];
  });

  it('handles Windows-style line separators', () => {
    tokenizer.split('abc\r');
    tokenizer.split('\ndef');
    tokenizer.flush();

    expect(tokens).toEqual(['abc', UC_TOKEN_CRLF, 'def']);
  });
  it('handles CR', () => {
    tokenizer.split('abc\rdef');
    tokenizer.flush();

    expect(tokens).toEqual(['abc', UC_TOKEN_CR, 'def']);
  });
  it('handles CR as first char', () => {
    tokenizer.split('\rdef');
    tokenizer.flush();

    expect(tokens).toEqual([UC_TOKEN_CR, 'def']);
  });
  it('handles CR after CR', () => {
    tokenizer.split('\r\rdef');
    tokenizer.flush();

    expect(tokens).toEqual([UC_TOKEN_CR, UC_TOKEN_CR, 'def']);
  });
  it('handles CR after LF', () => {
    tokenizer.split('\n\rdef');
    tokenizer.flush();

    expect(tokens).toEqual([UC_TOKEN_LF, UC_TOKEN_CR, 'def']);
  });
  it('handles LF', () => {
    tokenizer.split('abc\ndef');
    tokenizer.flush();

    expect(tokens).toEqual(['abc', UC_TOKEN_LF, 'def']);
  });
  it('handles LF as first char', () => {
    tokenizer.split('\ndef');
    tokenizer.flush();

    expect(tokens).toEqual([UC_TOKEN_LF, 'def']);
  });
  it('handles LF after LF', () => {
    tokenizer.split('\n\ndef');
    tokenizer.flush();

    expect(tokens).toEqual([UC_TOKEN_LF, UC_TOKEN_LF, 'def']);
  });

  describe.each([
    ['comma', ',', UC_TOKEN_COMMA],
    ['opening parenthesis', '(', UC_TOKEN_OPENING_PARENTHESIS],
    ['closing parenthesis', ')', UC_TOKEN_CLOSING_PARENTHESIS],
  ])('around %s', (_name, char, token) => {
    it('reports pads', () => {
      tokenizer.split(`abc   ${char}    def`);
      tokenizer.flush();

      expect(tokens).toEqual([
        'abc',
        UC_TOKEN_MASK_SPACE | (2 << 8),
        token,
        UC_TOKEN_MASK_SPACE | (3 << 8),
        'def',
      ]);
      expect(tokens).toEqual([
        'abc',
        UC_TOKEN_MASK_SPACE | (2 << 8),
        char.charCodeAt(0),
        UC_TOKEN_MASK_SPACE | (3 << 8),
        'def',
      ]);
    });
    it('concatenates leading pads', () => {
      tokenizer.split('abc  ');
      tokenizer.split(' ');
      tokenizer.split(char);
      tokenizer.split('  ');
      tokenizer.split('  def');
      tokenizer.flush();

      expect(tokens).toEqual([
        'abc',
        UC_TOKEN_MASK_SPACE | (2 << 8),
        token,
        UC_TOKEN_MASK_SPACE | (1 << 8),
        UC_TOKEN_MASK_SPACE | (1 << 8),
        'def',
      ]);
    });
    it('handles mixed pads', () => {
      tokenizer.split(`abc   ${char}   \t\tdef`);
      tokenizer.flush();

      expect(tokens).toEqual([
        'abc',
        UC_TOKEN_MASK_SPACE | (2 << 8),
        token,
        UC_TOKEN_MASK_SPACE | (2 << 8),
        UC_TOKEN_MASK_TAB | (1 << 8),
        'def',
      ]);
    });
  });

  describe.each([
    ['exclamation mark', '!', UC_TOKEN_EXCLAMATION_MARK],
    ['hash', '#', UC_TOKEN_HASH],
    ['dollar sign', '$', UC_TOKEN_DOLLAR_SIGN],
    ['ampersand', '&', UC_TOKEN_AMPERSAND],
    ['apostrophe', "'", UC_TOKEN_APOSTROPHE],
    ['asterisk', '*', UC_TOKEN_ASTERISK],
    ['plus sign', '+', UC_TOKEN_PLUS_SIGN],
    ['slash', '/', UC_TOKEN_SLASH],
    ['colon', ':', UC_TOKEN_COLON],
    ['semicolon', ';', UC_TOKEN_SEMICOLON],
    ['equals sign', '=', UC_TOKEN_EQUALS_SIGN],
    ['question mark', '?', UC_TOKEN_QUESTION_MARK],
    ['at-sign', '@', UC_TOKEN_AT_SIGN],
    ['opening bracket', '[', UC_TOKEN_OPENING_BRACKET],
    ['closing bracket', ']', UC_TOKEN_CLOSING_BRACKET],
  ])('around %s', (_name, char, token) => {
    it('emits pads as characters', () => {
      tokenizer.split(`abc   ${char}    def`);
      tokenizer.flush();

      expect(tokens).toEqual(['abc   ', token, '    def']);
      expect(tokens).toEqual(['abc   ', char.charCodeAt(0), '    def']);
    });
    it('concatenates pads', () => {
      tokenizer.split(`abc`);
      tokenizer.split(`   `);
      tokenizer.split(``);
      tokenizer.split(char);
      tokenizer.split(`  `);
      tokenizer.split(`  `);
      tokenizer.split(`def`);
      tokenizer.flush();

      expect(tokens).toEqual(['abc   ', token, '    def']);
    });
  });

  it('handles too long padding', () => {
    tokenizer.split('abc' + ' '.repeat(1000));
    tokenizer.flush();

    expect(tokens).toEqual([
      'abc',
      UC_TOKEN_MASK_SPACE | (255 << 8),
      UC_TOKEN_MASK_SPACE | (255 << 8),
      UC_TOKEN_MASK_SPACE | (255 << 8),
      UC_TOKEN_MASK_SPACE | (231 << 8),
    ]);
  });
  it('concatenates string tokens', () => {
    tokenizer.split('abc ');
    tokenizer.split('  def');
    tokenizer.flush();

    expect(tokens).toEqual(['abc   def']);
  });
  it('URI-decodes strings', () => {
    const input = '\u042a';
    const encoded = encodeURIComponent('\u042a');

    tokenizer.split(encoded.slice(0, 1));
    tokenizer.split(encoded.slice(1));
    tokenizer.flush();

    expect(tokens).toEqual([input]);
  });
});
