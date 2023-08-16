import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../../compiler/deserialization/ucd-compiler.js';
import { ucList } from '../../../schema/list/uc-list.js';
import { ucMap } from '../../../schema/map/uc-map.js';
import { ucString } from '../../../schema/string/uc-string.js';
import { UcDeserializer } from '../../../schema/uc-deserializer.js';
import { ucUnknown } from '../../../schema/unknown/uc-unknown.js';
import { scanUcTokens } from '../../scan-uc-tokens.js';
import { ucFormatCharge } from '../charge/uc-format-charge.js';
import { ucFormatPlainText } from '../plain-text/uc-format-plain-text.js';
import { ucFormatURIEncoded } from '../uri-encoded/uc-format-uri-encoded.js';
import { ucFormatURIParams } from './uc-format-uri-params.js';
import { UcURIParamsLexer } from './uc-uri-params.lexer.js';

describe('URI params deserializer', () => {
  describe('with default splitter', () => {
    let readValue: UcDeserializer<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap(
              {
                a: ucMap(
                  {
                    b: ucUnknown({ within: { uriParam: ucFormatURIEncoded() } }),
                    c: ucUnknown({ within: { uriParam: ucFormatURIEncoded() } }),
                  },
                  {
                    within: { uriParam: ucFormatURIParams() },
                  },
                ),
              },
              {
                where: ucFormatURIParams({ splitter: ';' }),
              },
            ),
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
            model: ucMap(
              {
                a: ucMap(
                  {
                    b: ucUnknown({ within: { uriParam: ucFormatURIEncoded() } }),
                    c: ucUnknown({ within: { uriParam: ucFormatURIEncoded() } }),
                  },
                  {
                    within: { uriParam: ucFormatURIParams({ splitter: ';' }) },
                  },
                ),
              },
              {
                where: ucFormatURIParams(),
              },
            ),
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

  it('permits custom inset', async () => {
    const compiler = new UcdCompiler({
      models: {
        readParams: {
          model: ucMap(
            {
              foo: ucString({
                within: {
                  uriParam: ucFormatPlainText(),
                },
              }),
              bar: ucList(ucString()),
            },
            {
              within: {
                inset: ucFormatCharge({ plusAsSpace: true }),
              },
            },
          ),
          mode: 'sync',
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
          model: ucMap(
            {
              foo: ucString({
                within: {
                  inset: ucFormatPlainText(),
                  charge: ucFormatPlainText({ raw: true }), // Never happens
                },
              }),
              bar: ucList(ucString()),
            },
            {
              within: {
                inset: ucFormatCharge({ plusAsSpace: true }),
              },
            },
          ),
          mode: 'sync',
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
});
