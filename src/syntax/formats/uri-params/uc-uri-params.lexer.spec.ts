import { beforeAll, describe, expect, it } from '@jest/globals';
import { esline } from 'esgen';
import { UcdCompiler } from '../../../compiler/deserialization/ucd-compiler.js';
import { UC_MODULE_CHURI } from '../../../compiler/impl/uc-modules.js';
import { ucList } from '../../../schema/list/uc-list.js';
import { ucMap } from '../../../schema/map/uc-map.js';
import { ucString } from '../../../schema/string/uc-string.js';
import { UcDeserializer } from '../../../schema/uc-deserializer.js';
import { ucUnknown } from '../../../schema/unknown/uc-unknown.js';
import { scanUcTokens } from '../../scan-uc-tokens.js';
import {
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_DOLLAR_SIGN,
  UC_TOKEN_INSET_END,
  UC_TOKEN_INSET_URI_PARAM,
  UC_TOKEN_OPENING_PARENTHESIS,
  UcToken,
} from '../../uc-token.js';
import { ucFormatPlainText } from '../plain-text/uc-format-plain-text.js';
import { ucInsetURIEncoded } from '../uri-encoded/uc-inset-uri-encoded.js';
import { ucFormatURIParams } from './uc-format-uri-params.js';
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
  it('permits custom inset', async () => {
    const compiler = new UcdCompiler({
      models: {
        readParams: {
          model: ucMap({
            foo: ucString({
              within: {
                uriParam: ucFormatPlainText(),
              },
            }),
            bar: ucList(ucString()),
          }),
          mode: 'sync',
          inset({ emit }) {
            const UcChargeLexer = UC_MODULE_CHURI.import('UcChargeLexer');

            return esline`return ${UcChargeLexer}.plusAsSpace(${emit});`;
          },
        },
      },
      presentations: ['uriParam', 'charge'],
    });

    const { readParams } = await compiler.evaluate();

    expect(
      readParams(scanUcTokens(emit => new UcURIParamsLexer(emit), 'foo=1,2,3&bar=4,+5+,6+')),
    ).toEqual({
      foo: '1,2,3',
      bar: ['4', '5', '6'],
    });
  });
  it('uses default custom inset', async () => {
    const compiler = new UcdCompiler({
      models: {
        readParams: {
          model: ucMap({
            foo: ucString({
              where: ucFormatPlainText(),
              within: {
                charge: ucFormatPlainText({ raw: true }),
              },
            }),
            bar: ucList(ucString()),
          }),
          mode: 'sync',
          inset({ emit }) {
            const UcChargeLexer = UC_MODULE_CHURI.import('UcChargeLexer');

            return esline`return ${UcChargeLexer}.plusAsSpace(${emit});`;
          },
        },
      },
      presentations: ['uriParam', 'charge'],
    });

    const { readParams } = await compiler.evaluate();

    expect(
      readParams(scanUcTokens(emit => new UcURIParamsLexer(emit), 'foo=1,2,3&bar=4,+5+,6+')),
    ).toEqual({
      foo: '1,2,3',
      bar: ['4', '5', '6'],
    });
  });

  function scan(...input: string[]): UcToken[] {
    return scanUcTokens(emit => new UcURIParamsLexer(emit), ...input);
  }

  function scanMatrix(...input: string[]): UcToken[] {
    return scanUcTokens(emit => new UcURIParamsLexer(emit, ';'), ...input);
  }
});

describe('ucInsetURIParams', () => {
  describe('with default splitter', () => {
    let readValue: UcDeserializer<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap({
              a: ucMap(
                {
                  b: ucUnknown({ within: { uriParam: ucInsetURIEncoded() } }),
                  c: ucUnknown({ within: { uriParam: ucInsetURIEncoded() } }),
                },
                {
                  within: { uriParam: ucFormatURIParams() },
                },
              ),
            }),
            lexer: ({ emit }) => {
              const Lexer = UC_MODULE_CHURI.import(UcURIParamsLexer.name);

              return esline`return new ${Lexer}(${emit}, ';')`;
            },
          },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('recognizes params', () => {
      expect(readValue(`a=b='te%20st'&c=2`)).toEqual({ a: { b: `'te st'`, c: '2' } });
      expect(readValue(`a=b=te+st&c=2`)).toEqual({ a: { b: 'te+st', c: '2' } });
      expect(readValue(`a=b=%33&c=2`)).toEqual({ a: { b: '3', c: '2' } });
    });
  });

  describe('with matrix splitter', () => {
    let readValue: UcDeserializer<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap({
              a: ucMap(
                {
                  b: ucUnknown({ within: { uriParam: ucInsetURIEncoded() } }),
                  c: ucUnknown({ within: { uriParam: ucInsetURIEncoded() } }),
                },
                {
                  within: { uriParam: ucFormatURIParams({ splitter: ';' }) },
                },
              ),
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

    it('recognizes params', () => {
      expect(readValue(`a=b='te%20st';c=2`)).toEqual({ a: { b: `'te st'`, c: '2' } });
      expect(readValue(`a=b=te+st;c=2`)).toEqual({ a: { b: 'te+st', c: '2' } });
      expect(readValue(`a=b=%33;c=2`)).toEqual({ a: { b: '3', c: '2' } });
    });
  });
});
