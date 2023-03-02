import { beforeEach, describe, expect, it } from '@jest/globals';
import { BasicUcdDefs } from '../compiler/deserialization/basic.ucd-defs.js';
import { UcdLib } from '../compiler/deserialization/ucd-lib.js';
import { UC_TOKEN_EXCLAMATION_MARK } from '../syntax/uc-token.js';
import { UcEntity } from './uc-entity.js';
import { UcErrorInfo } from './uc-error.js';

describe('UcEntity', () => {
  const entity = new UcEntity('!foo%20bar');

  it('contains raw encoded value', () => {
    expect(entity.raw).toBe('!foo%20bar');
    expect(String(entity)).toBe('!foo%20bar');
    expect(entity.toString()).toBe('!foo%20bar');
    expect(entity.valueOf()).toBe('!foo%20bar');
  });

  it('has string tag', () => {
    expect(entity[Symbol.toStringTag]).toBe('UcEntity');
  });

  describe('deserializer', () => {
    const onError = (error: UcErrorInfo): void => {
      errors.push(error);
    };
    let errors: unknown[];

    beforeEach(() => {
      errors = [];
    });

    it('does not recognize unknown entity', async () => {
      const lib = new UcdLib({
        schemae: {
          readNumber: Number,
        },
        definitions: BasicUcdDefs,
      });

      const { readNumber } = await lib.compile('sync').toDeserializers();

      expect(readNumber('!Infinity', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unrecognizedEntity',
          details: {
            entity: [UC_TOKEN_EXCLAMATION_MARK, 'Infinity'],
          },
          message: 'Unrecognized entity: !Infinity',
        },
      ]);
    });

    it('recognizes by custom prefix', async () => {
      const lib = new UcdLib({
        schemae: {
          readString: String,
        },
        definitions: [
          ...BasicUcdDefs,
          {
            entityPrefix: '!plain',
            addHandler({ lib, prefix, suffix }) {
              return `${prefix}${lib.import('@hatsy/churi/spec', 'readPlainEntity')}${suffix}`;
            },
          },
        ],
      });
      const { readString } = await lib.compile('sync').toDeserializers();

      expect(readString('!plain:test')).toBe('!plain:test');
    });
  });
});
