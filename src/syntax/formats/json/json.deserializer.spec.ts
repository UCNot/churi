import { beforeAll, describe, expect, it } from '@jest/globals';
import { esline } from 'esgen';
import { UcdCompiler } from '../../../compiler/deserialization/ucd-compiler.js';
import { UC_MODULE_CHURI } from '../../../compiler/impl/uc-modules.js';
import { UcDeserializer } from '../../../schema/uc-deserializer.js';
import { ucUnknown } from '../../../schema/unknown/uc-unknown.js';
import { UC_TOKEN_INSET_END, UC_TOKEN_INSET_URI_PARAM } from '../../uc-token.js';
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
    let readValue: UcDeserializer.ByTokens<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucUnknown(),
            inset({ emit }) {
              const Lexer = UC_MODULE_CHURI.import(UcJSONLexer.name);

              return esline`return new ${Lexer}(${emit});`;
            },
          },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('recognizes primitive values', () => {
      expect(readValue([UC_TOKEN_INSET_URI_PARAM, `"test"`, UC_TOKEN_INSET_END])).toBe(`test`);
      expect(readValue([UC_TOKEN_INSET_URI_PARAM, `13`, UC_TOKEN_INSET_END])).toBe(13);
      expect(readValue([UC_TOKEN_INSET_URI_PARAM, `null`, UC_TOKEN_INSET_END])).toBeNull();
      expect(readValue([UC_TOKEN_INSET_URI_PARAM, `true`, UC_TOKEN_INSET_END])).toBe(true);
      expect(readValue([UC_TOKEN_INSET_URI_PARAM, `false`, UC_TOKEN_INSET_END])).toBe(false);
    });

    it('recognizes object', () => {
      const object = { foo: [1, 2, 3] };

      expect(
        readValue([UC_TOKEN_INSET_URI_PARAM, JSON.stringify(object), UC_TOKEN_INSET_END]),
      ).toEqual(object);
    });
  });
});
