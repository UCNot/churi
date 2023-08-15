import { beforeAll, describe, expect, it } from '@jest/globals';
import { esline } from 'esgen';
import { UcdCompiler } from '../../../compiler/deserialization/ucd-compiler.js';
import { UC_MODULE_CHURI } from '../../../compiler/impl/uc-modules.js';
import { ucMap } from '../../../schema/map/uc-map.js';
import { UcDeserializer } from '../../../schema/uc-deserializer.js';
import { ucUnknown } from '../../../schema/unknown/uc-unknown.js';
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
            model: ucMap({
              a: ucMap(
                {
                  b: ucUnknown({ within: { uriParam: ucFormatURIEncoded() } }),
                  c: ucUnknown({ within: { uriParam: ucFormatURIEncoded() } }),
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
                  b: ucUnknown({ within: { uriParam: ucFormatURIEncoded() } }),
                  c: ucUnknown({ within: { uriParam: ucFormatURIEncoded() } }),
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
