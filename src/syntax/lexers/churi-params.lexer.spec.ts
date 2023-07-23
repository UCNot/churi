import { describe, expect, it } from '@jest/globals';
import { esline } from 'esgen';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { UC_MODULE_CHURI } from '../../compiler/impl/uc-modules.js';
import { ucList } from '../../schema/list/uc-list.js';
import { ucMap } from '../../schema/map/uc-map.js';
import { ucString } from '../../schema/string/uc-string.js';
import { scanUcTokens } from '../scan-uc-tokens.js';
import {
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_DOLLAR_SIGN,
  UC_TOKEN_INSET,
  UC_TOKEN_OPENING_PARENTHESIS,
  UcToken,
} from '../uc-token.js';
import { ChURIParamsLexer } from './churi-params.lexer.js';
import { ucInsetPlainText } from './uc-plain-text.lexer.js';

describe('ChURIParamsLexer', () => {
  it('recognizes query params', () => {
    expect(scan('first=1&second=2')).toEqual([
      'first',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET,
      '1',
      UC_TOKEN_INSET,
      UC_TOKEN_CLOSING_PARENTHESIS,
      'second',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET,
      '2',
      UC_TOKEN_INSET,
      UC_TOKEN_CLOSING_PARENTHESIS,
    ]);
  });
  it('recognizes matrix params', () => {
    expect(scanMatrix('first=1;second=2')).toEqual([
      'first',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET,
      '1',
      UC_TOKEN_INSET,
      UC_TOKEN_CLOSING_PARENTHESIS,
      'second',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET,
      '2',
      UC_TOKEN_INSET,
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
      UC_TOKEN_INSET,
      '123',
      UC_TOKEN_INSET,
      UC_TOKEN_CLOSING_PARENTHESIS,
    ]);
    expect(scan('ab%', '20cd=123')).toEqual([
      'ab cd',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET,
      '123',
      UC_TOKEN_INSET,
      UC_TOKEN_CLOSING_PARENTHESIS,
    ]);
  });
  it('recognizes value split across chunks', () => {
    expect(scan('a=', 'cd=1%23', '=456')).toEqual([
      'a',
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET,
      'cd=1%23',
      '=456',
      UC_TOKEN_INSET,
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
      UC_TOKEN_INSET,
      'a',
      UC_TOKEN_INSET,
      UC_TOKEN_CLOSING_PARENTHESIS,
      UC_TOKEN_DOLLAR_SIGN,
      UC_TOKEN_OPENING_PARENTHESIS,
      UC_TOKEN_INSET,
      'b',
      UC_TOKEN_INSET,
      UC_TOKEN_CLOSING_PARENTHESIS,
    ]);
  });
  it('permits custom insets', async () => {
    const compiler = new UcdCompiler({
      models: {
        readParams: {
          model: ucMap({
            foo: ucString({ within: { uriParams: ucInsetPlainText() } }),
            bar: ucList(ucString()),
          }),
          mode: 'sync',
        },
      },
      presentation: 'uriParams',
      inset({ emit }) {
        const UcChargeLexer = UC_MODULE_CHURI.import('UcChargeLexer');

        return esline`return ${UcChargeLexer}.plusAsSpace(${emit});`;
      },
    });
    const { readParams } = await compiler.evaluate();

    expect(
      readParams(scanUcTokens(emit => new ChURIParamsLexer(emit), 'foo=1,2,3&bar=4,+5+,6+')),
    ).toEqual({
      foo: '1,2,3',
      bar: ['4', '5', '6'],
    });
  });

  function scan(...input: string[]): UcToken[] {
    return scanUcTokens(emit => new ChURIParamsLexer(emit), ...input);
  }

  function scanMatrix(...input: string[]): UcToken[] {
    return scanUcTokens(emit => new ChURIParamsLexer(emit, ';'), ...input);
  }
});
