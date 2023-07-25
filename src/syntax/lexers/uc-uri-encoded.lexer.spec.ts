import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { ucMap } from '../../schema/map/uc-map.js';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { ucUnknown } from '../../schema/unknown/uc-unknown.js';
import { scanUcTokens } from '../scan-uc-tokens.js';
import { UC_TOKEN_APOSTROPHE, UcToken } from '../uc-token.js';
import { ChURIParamsLexer } from './churi-params.lexer.js';
import { UcURIEncodedLexer, ucInsetURIEncoded } from './uc-uri-encoded.lexer.js';

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

describe('ucInsetURIEncoded', () => {
  describe('in default mode', () => {
    let readValue: UcDeserializer<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap({
              a: ucUnknown({ within: { uriParam: ucInsetURIEncoded() } }),
            }),
          },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('URI-decodes values', () => {
      expect(readValue(scan(`a='te%20st'`))).toEqual({ a: `'te st'` });
      expect(readValue(scan(`a=te+st`))).toEqual({ a: 'te+st' });
      expect(readValue(scan(`a=%33`))).toEqual({ a: '3' });
    });
  });

  describe('in raw text mode', () => {
    let readValue: UcDeserializer<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap({
              a: ucUnknown({ within: { uriParam: ucInsetURIEncoded({ raw: true }) } }),
            }),
          },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('URI-decodes values', () => {
      expect(readValue(scan(`a='te%20st'`))).toEqual({ a: `'te st'` });
      expect(readValue(scan(`a='te+st'`))).toEqual({ a: `'te+st'` });
      expect(readValue(scan(`a=%33`))).toEqual({ a: 3 });
    });
  });

  describe('in plus-as-space mode', () => {
    let readValue: UcDeserializer<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap({
              a: ucUnknown({ within: { uriParam: ucInsetURIEncoded({ plusAsSpace: true }) } }),
            }),
          },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('URI-decodes values', () => {
      expect(readValue(scan(`a='te%20st'`))).toEqual({ a: `'te st'` });
      expect(readValue(scan(`a='te+st'`))).toEqual({ a: `'te st'` });
      expect(readValue(scan(`a=%33`))).toEqual({ a: '3' });
    });
  });

  describe('in raw plus-as-space mode', () => {
    let readValue: UcDeserializer<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap({
              a: ucUnknown({
                within: { uriParam: ucInsetURIEncoded({ plusAsSpace: true, raw: true }) },
              }),
            }),
          },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('URI-decodes values', () => {
      expect(readValue(scan(`a='te%20st'`))).toEqual({ a: `'te st'` });
      expect(readValue(scan(`a='te+st'`))).toEqual({ a: `'te st'` });
      expect(readValue(scan(`a=%33+`))).toEqual({ a: 3 });
    });
  });

  function scan(...input: string[]): UcToken[] {
    return scanUcTokens(emit => new ChURIParamsLexer(emit), ...input);
  }
});
