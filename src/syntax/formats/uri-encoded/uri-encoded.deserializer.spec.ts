import { beforeAll, describe, expect, it } from '@jest/globals';
import { esline } from 'esgen';
import { UcdCompiler } from '../../../compiler/deserialization/ucd-compiler.js';
import { UC_MODULE_CHURI } from '../../../compiler/impl/uc-modules.js';
import { ucMap } from '../../../schema/map/uc-map.js';
import { UcDeserializer } from '../../../schema/uc-deserializer.js';
import { ucUnknown } from '../../../schema/unknown/uc-unknown.js';
import { readChunks } from '../../../spec/read-chunks.js';
import { scanUcTokens } from '../../scan-uc-tokens.js';
import { UcToken } from '../../uc-token.js';
import { UcURIParamsLexer } from '../uri-params/uc-uri-params.lexer.js';
import { ucFormatURIEncoded } from './uc-format-uri-encoded.js';

describe('URI-encoded deserializer', () => {
  describe('in default mode', () => {
    let readValue: UcDeserializer<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap({
              a: ucUnknown({ within: { uriParam: ucFormatURIEncoded() } }),
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
      expect(readValue(`a='te%20st'`)).toEqual({ a: `'te st'` });
      expect(readValue(`a=te+st`)).toEqual({ a: 'te+st' });
      expect(readValue(`a=%33`)).toEqual({ a: '3' });
    });
  });

  describe('in raw text mode', () => {
    let readValue: UcDeserializer<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap({
              a: ucUnknown({ within: { uriParam: ucFormatURIEncoded({ raw: true }) } }),
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

    it('URI-decodes values synchronously', () => {
      expect(readValue(`a='te%20st'`)).toEqual({ a: `'te st'` });
      expect(readValue(`a='te+st'`)).toEqual({ a: `'te+st'` });
      expect(readValue(`a=%33`)).toEqual({ a: 3 });
    });
    it('URI-decodes values asynchronously', async () => {
      await expect(readValue(readChunks(`a='te%20st'`))).resolves.toEqual({ a: `'te st'` });
      await expect(readValue(readChunks(`a='te+st'`))).resolves.toEqual({ a: `'te+st'` });
      await expect(readValue(readChunks(`a=%33`))).resolves.toEqual({ a: 3 });
    });
  });

  describe('in plus-as-space mode', () => {
    let readValue: UcDeserializer.Async<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap({
              a: ucUnknown({ within: { uriParam: ucFormatURIEncoded({ plusAsSpace: true }) } }),
            }),
            mode: 'async',
            lexer: ({ emit }) => {
              const Lexer = UC_MODULE_CHURI.import(UcURIParamsLexer.name);

              return esline`return new ${Lexer}(${emit})`;
            },
          },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('URI-decodes values synchronously', async () => {
      await expect(readValue(readChunks(`a='te%20st'`))).resolves.toEqual({ a: `'te st'` });
      await expect(readValue(readChunks(`a='te+st'`))).resolves.toEqual({ a: `'te st'` });
      await expect(readValue(readChunks(`a=%33`))).resolves.toEqual({ a: '3' });
    });
  });

  describe('in raw plus-as-space mode', () => {
    let readValue: UcDeserializer.Sync<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap({
              a: ucUnknown({
                within: { uriParam: ucFormatURIEncoded({ plusAsSpace: true, raw: true }) },
              }),
            }),
            mode: 'sync',
            lexer: ({ emit }) => {
              const Lexer = UC_MODULE_CHURI.import(UcURIParamsLexer.name);

              return esline`return new ${Lexer}(${emit})`;
            },
          },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('URI-decodes values by chunks', () => {
      expect(readValue(`a='te%20st'`)).toEqual({ a: `'te st'` });
      expect(readValue(`a='te+st'`)).toEqual({ a: `'te st'` });
      expect(readValue(`a=%33+`)).toEqual({ a: 3 });
    });
    it('URI-decodes values by tokens', () => {
      expect(readValue(scan(`a='te%20st'`))).toEqual({ a: `'te st'` });
      expect(readValue(scan(`a='te+st'`))).toEqual({ a: `'te st'` });
      expect(readValue(scan(`a=%33+`))).toEqual({ a: 3 });

      function scan(...input: string[]): UcToken[] {
        return scanUcTokens(emit => new UcURIParamsLexer(emit), ...input);
      }
    });
  });
});
