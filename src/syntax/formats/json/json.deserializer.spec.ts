import { beforeAll, describe, expect, it } from '@jest/globals';
import { esline } from 'esgen';
import { UcdCompiler } from '../../../compiler/deserialization/ucd-compiler.js';
import { UC_MODULE_CHURI } from '../../../compiler/impl/uc-modules.js';
import { ucMap } from '../../../schema/map/uc-map.js';
import { UcDeserializer } from '../../../schema/uc-deserializer.js';
import { ucUnknown } from '../../../schema/unknown/uc-unknown.js';
import { UcURIParamsLexer } from '../uri-params/uc-uri-params.lexer.js';
import { ucFormatJSON } from './uc-format-json.js';
import { UcJSONLexer } from './uc-json.lexer.js';

describe('JSON deserializer', () => {
  describe('at top level', () => {
    let readValue: UcDeserializer<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucUnknown(),
            lexer({ emit }) {
              const Lexer = UC_MODULE_CHURI.import(UcJSONLexer.name);

              return esline`return new ${Lexer}(${emit});`;
            },
          },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('recognizes primitive values', () => {
      expect(readValue(`"test"`)).toBe(`test`);
      expect(readValue(`13`)).toBe(13);
      expect(readValue(`null`)).toBeNull();
      expect(readValue(`true`)).toBe(true);
      expect(readValue(`false`)).toBe(false);
    });

    it('recognizes object', () => {
      const object = { foo: [1, 2, 3] };

      expect(readValue(JSON.stringify(object))).toEqual(object);
    });
  });

  describe('as inset', () => {
    let readValue: UcDeserializer<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap({
              test: ucUnknown({
                within: {
                  uriParam: ucFormatJSON(),
                },
              }),
            }),
            lexer({ emit }) {
              const Lexer = UC_MODULE_CHURI.import(UcURIParamsLexer.name);

              return esline`return new ${Lexer}(${emit});`;
            },
          },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('recognizes primitive values', () => {
      expect(readValue(`test="test"`)).toEqual({ test: `test` });
      expect(readValue(`test=13`)).toEqual({ test: 13 });
      expect(readValue(`test=null`)).toEqual({ test: null });
      expect(readValue(`test=true`)).toEqual({ test: true });
      expect(readValue(`test=false`)).toEqual({ test: false });
    });

    it('recognizes object', () => {
      const object = { foo: [1, 2, 3] };

      expect(readValue(`test=${JSON.stringify(object)}`)).toEqual({ test: object });
    });
  });
});
