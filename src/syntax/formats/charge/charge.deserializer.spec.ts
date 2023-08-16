import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../../compiler/deserialization/ucd-compiler.js';
import { ucMap } from '../../../schema/map/uc-map.js';
import { UcDeserializer } from '../../../schema/uc-deserializer.js';
import { ucUnknown } from '../../../schema/unknown/uc-unknown.js';
import { ucFormatURIParams } from '../uri-params/uc-format-uri-params.js';
import { ucFormatCharge } from './uc-format-charge.js';

describe('URI charge deserializer', () => {
  describe('in default mode', () => {
    let readValue: UcDeserializer<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucMap(
              {
                a: ucUnknown({ within: { uriParam: ucFormatCharge() } }),
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
            model: ucMap(
              {
                a: ucUnknown({
                  within: {
                    uriParam: ucFormatCharge({ plusAsSpace: true }),
                  },
                }),
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

    it('decodes URI charge values', () => {
      expect(readValue(`a='te%20st'`)).toEqual({ a: `te st'` });
      expect(readValue(`a='te+st'`)).toEqual({ a: `te st'` });
      expect(readValue(`a=%33`)).toEqual({ a: 3 });
    });
  });
});
