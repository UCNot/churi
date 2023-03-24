import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcLexer } from './uc-lexer.js';
import {
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
  UC_TOKEN_OPENING_BRACKET,
  UC_TOKEN_OPENING_PARENTHESIS,
  UC_TOKEN_PLUS_SIGN,
  UC_TOKEN_PREFIX_SPACE,
  UC_TOKEN_PREFIX_TAB,
  UC_TOKEN_QUESTION_MARK,
  UC_TOKEN_SEMICOLON,
  UC_TOKEN_SLASH,
  UcToken,
} from './uc-token.js';

describe('UcLexer', () => {
  let tokenizer: UcLexer;
  let tokens: UcToken[];

  beforeEach(() => {
    tokenizer = new UcLexer(token => {
      tokens.push(token);
    });
    tokens = [];
  });

  it('handles Windows-style line separators', () => {
    tokenizer.scan('abc\r');
    tokenizer.scan('\ndef');
    tokenizer.flush();

    expect(tokens).toEqual(['abc', UC_TOKEN_CRLF, 'def']);
  });
  it('handles CR', () => {
    tokenizer.scan('abc\rdef');
    tokenizer.flush();

    expect(tokens).toEqual(['abc', UC_TOKEN_CR, 'def']);
  });
  it('handles CR as first char', () => {
    tokenizer.scan('\rdef');
    tokenizer.flush();

    expect(tokens).toEqual([UC_TOKEN_CR, 'def']);
  });
  it('handles CR after CR', () => {
    tokenizer.scan('\r\rdef');
    tokenizer.flush();

    expect(tokens).toEqual([UC_TOKEN_CR, UC_TOKEN_CR, 'def']);
  });
  it('handles CR after LF', () => {
    tokenizer.scan('\n\rdef');
    tokenizer.flush();

    expect(tokens).toEqual([UC_TOKEN_LF, UC_TOKEN_CR, 'def']);
  });
  it('handles LF', () => {
    tokenizer.scan('abc\ndef');
    tokenizer.flush();

    expect(tokens).toEqual(['abc', UC_TOKEN_LF, 'def']);
  });
  it('handles LF as first char', () => {
    tokenizer.scan('\ndef');
    tokenizer.flush();

    expect(tokens).toEqual([UC_TOKEN_LF, 'def']);
  });
  it('handles LF after LF', () => {
    tokenizer.scan('\n\ndef');
    tokenizer.flush();

    expect(tokens).toEqual([UC_TOKEN_LF, UC_TOKEN_LF, 'def']);
  });

  describe.each([
    ['comma', ',', UC_TOKEN_COMMA],
    ['opening parenthesis', '(', UC_TOKEN_OPENING_PARENTHESIS],
    ['closing parenthesis', ')', UC_TOKEN_CLOSING_PARENTHESIS],
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
    it('reports pads', () => {
      tokenizer.scan(`abc   ${char}    def`);
      tokenizer.flush();

      expect(tokens).toEqual([
        'abc',
        UC_TOKEN_PREFIX_SPACE | (2 << 8),
        token,
        UC_TOKEN_PREFIX_SPACE | (3 << 8),
        'def',
      ]);
      expect(tokens).toEqual([
        'abc',
        UC_TOKEN_PREFIX_SPACE | (2 << 8),
        char.charCodeAt(0),
        UC_TOKEN_PREFIX_SPACE | (3 << 8),
        'def',
      ]);
    });
    it('concatenates leading pads', () => {
      tokenizer.scan('abc  ');
      tokenizer.scan(' ');
      tokenizer.scan(char);
      tokenizer.scan('  ');
      tokenizer.scan('  def');
      tokenizer.flush();

      expect(tokens).toEqual([
        'abc',
        UC_TOKEN_PREFIX_SPACE | (2 << 8),
        token,
        UC_TOKEN_PREFIX_SPACE | (1 << 8),
        UC_TOKEN_PREFIX_SPACE | (1 << 8),
        'def',
      ]);
    });
    it('handles mixed pads', () => {
      tokenizer.scan(`abc   ${char}   \t\tdef`);
      tokenizer.flush();

      expect(tokens).toEqual([
        'abc',
        UC_TOKEN_PREFIX_SPACE | (2 << 8),
        token,
        UC_TOKEN_PREFIX_SPACE | (2 << 8),
        UC_TOKEN_PREFIX_TAB | (1 << 8),
        'def',
      ]);
    });
  });

  it('handles too long padding', () => {
    tokenizer.scan('abc' + ' '.repeat(1000));
    tokenizer.flush();

    expect(tokens).toEqual([
      'abc',
      UC_TOKEN_PREFIX_SPACE | (255 << 8),
      UC_TOKEN_PREFIX_SPACE | (255 << 8),
      UC_TOKEN_PREFIX_SPACE | (255 << 8),
      UC_TOKEN_PREFIX_SPACE | (231 << 8),
    ]);
  });
  it('handles paddings at the begin of input', () => {
    tokenizer.scan('  ');
    tokenizer.scan('  abc');
    tokenizer.flush();

    expect(tokens).toEqual([
      UC_TOKEN_PREFIX_SPACE | (1 << 8),
      UC_TOKEN_PREFIX_SPACE | (1 << 8),
      'abc',
    ]);
  });
  it('handles paddings at the end of input', () => {
    tokenizer.scan('');
    tokenizer.scan('abc  ');
    tokenizer.scan('  ');
    tokenizer.flush();

    expect(tokens).toEqual(['abc', UC_TOKEN_PREFIX_SPACE | (3 << 8)]);
  });
  it('concatenates string tokens', () => {
    tokenizer.scan('abc ');
    tokenizer.scan('  def');
    tokenizer.flush();

    expect(tokens).toEqual(['abc   def']);
  });
  it('URI-decodes strings', () => {
    const input = '\u042a';
    const encoded = encodeURIComponent('\u042a');

    tokenizer.scan(encoded.slice(0, 1));
    tokenizer.scan(encoded.slice(1));
    tokenizer.flush();

    expect(tokens).toEqual([input]);
  });
});
