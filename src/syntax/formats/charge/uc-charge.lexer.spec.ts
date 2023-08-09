import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { esline } from 'esgen';
import { UcdCompiler } from '../../../compiler/deserialization/ucd-compiler.js';
import { UC_MODULE_CHURI } from '../../../compiler/impl/uc-modules.js';
import { ucMap } from '../../../schema/map/uc-map.js';
import { UcDeserializer } from '../../../schema/uc-deserializer.js';
import { ucUnknown } from '../../../schema/unknown/uc-unknown.js';
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
} from '../../uc-token.js';
import { UcURIParamsLexer } from '../uri-params/uc-uri-params.lexer.js';
import { UcChargeLexer } from './uc-charge.lexer.js';
import { ucFormatCharge } from './uc-inset-charge.js';

describe('UcChargeLexer', () => {
  let lexer: UcChargeLexer;
  let tokens: UcToken[];

  beforeEach(() => {
    lexer = new UcChargeLexer(token => {
      tokens.push(token);
    });
    tokens = [];
  });

  it('handles Windows-style line separators', () => {
    lexer.scan('abc\r');
    lexer.scan('\ndef');
    lexer.flush();

    expect(tokens).toEqual(['abc', UC_TOKEN_CRLF, 'def']);
  });
  it('handles CR', () => {
    lexer.scan('abc\rdef');
    lexer.flush();

    expect(tokens).toEqual(['abc', UC_TOKEN_CR, 'def']);
  });
  it('handles CR as first char', () => {
    lexer.scan('\rdef');
    lexer.flush();

    expect(tokens).toEqual([UC_TOKEN_CR, 'def']);
  });
  it('handles CR after CR', () => {
    lexer.scan('\r\rdef');
    lexer.flush();

    expect(tokens).toEqual([UC_TOKEN_CR, UC_TOKEN_CR, 'def']);
  });
  it('handles CR after LF', () => {
    lexer.scan('\n\rdef');
    lexer.flush();

    expect(tokens).toEqual([UC_TOKEN_LF, UC_TOKEN_CR, 'def']);
  });
  it('handles LF', () => {
    lexer.scan('abc\ndef');
    lexer.flush();

    expect(tokens).toEqual(['abc', UC_TOKEN_LF, 'def']);
  });
  it('handles LF as first char', () => {
    lexer.scan('\ndef');
    lexer.flush();

    expect(tokens).toEqual([UC_TOKEN_LF, 'def']);
  });
  it('handles LF after LF', () => {
    lexer.scan('\n\ndef');
    lexer.flush();

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
      lexer.scan(`abc   ${char}    def`);
      lexer.flush();

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
      lexer.scan('abc  ');
      lexer.scan(' ');
      lexer.scan(char);
      lexer.scan('  ');
      lexer.scan('  def');
      lexer.flush();

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
      lexer.scan(`abc   ${char}   \t\tdef`);
      lexer.flush();

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
    lexer.scan('abc' + ' '.repeat(1000));
    lexer.flush();

    expect(tokens).toEqual([
      'abc',
      UC_TOKEN_PREFIX_SPACE | (255 << 8),
      UC_TOKEN_PREFIX_SPACE | (255 << 8),
      UC_TOKEN_PREFIX_SPACE | (255 << 8),
      UC_TOKEN_PREFIX_SPACE | (231 << 8),
    ]);
  });
  it('handles paddings at the begin of input', () => {
    lexer.scan('  ');
    lexer.scan('  abc');
    lexer.flush();

    expect(tokens).toEqual([
      UC_TOKEN_PREFIX_SPACE | (1 << 8),
      UC_TOKEN_PREFIX_SPACE | (1 << 8),
      'abc',
    ]);
  });
  it('handles paddings at the end of input', () => {
    lexer.scan('');
    lexer.scan('abc  ');
    lexer.scan('  ');
    lexer.flush();

    expect(tokens).toEqual(['abc', UC_TOKEN_PREFIX_SPACE | (3 << 8)]);
  });
  it('concatenates string tokens', () => {
    lexer.scan('abc ');
    lexer.scan('  def');
    lexer.flush();

    expect(tokens).toEqual(['abc   def']);
  });
  it('URI-decodes strings', () => {
    const input = '\u042a';
    const encoded = encodeURIComponent('\u042a');

    lexer.scan(encoded.slice(0, 1));
    lexer.scan(encoded.slice(1));
    lexer.flush();

    expect(tokens).toEqual([input]);
  });

  describe('scanParam', () => {
    it('decodes plus sign as space', () => {
      expect(UcChargeLexer.scanParam('abc++', '++def')).toEqual(['abc    def']);
    });
    it('decodes plus sign as space padding', () => {
      expect(UcChargeLexer.scanParam('++++abcdef')).toEqual([
        UC_TOKEN_PREFIX_SPACE,
        UC_TOKEN_PREFIX_SPACE,
        UC_TOKEN_PREFIX_SPACE,
        UC_TOKEN_PREFIX_SPACE,
        'abcdef',
      ]);
    });
  });
});

describe('ucInsetCharge', () => {
  describe('in default mode', () => {
    let readValue: UcDeserializer<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap({
              a: ucUnknown({ within: { uriParam: ucFormatCharge() } }),
            }),
            lexer: ({ emit }) => {
              const Lexer = UC_MODULE_CHURI.import(UcURIParamsLexer.name);

              return esline`return new ${Lexer}(${emit})`;
            },
          },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('URI-decodes values', () => {
      expect(readValue(`a='te%20st'`)).toEqual({ a: `te st'` });
      expect(readValue(`a=te+st`)).toEqual({ a: 'te+st' });
      expect(readValue(`a=%33`)).toEqual({ a: 3 });
    });
  });

  describe('in plus-as-space mode', () => {
    let readValue: UcDeserializer<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap({
              a: ucUnknown({
                within: {
                  uriParam: ucFormatCharge({ plusAsSpace: true }),
                },
              }),
            }),
            lexer: ({ emit }) => {
              const Lexer = UC_MODULE_CHURI.import(UcURIParamsLexer.name);

              return esline`return new ${Lexer}(${emit})`;
            },
          },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('decodes URI charge values', () => {
      expect(readValue(`a='te%20st'`)).toEqual({ a: `te st'` });
      expect(readValue(`a='te+st'`)).toEqual({ a: `te st'` });
      expect(readValue(`a=%33`)).toEqual({ a: 3 });
    });
  });
});
