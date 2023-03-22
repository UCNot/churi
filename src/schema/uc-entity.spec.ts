import { beforeEach, describe, expect, it } from '@jest/globals';
import { BasicUcdDefs } from '../compiler/deserialization/basic.ucd-defs.js';
import { UcdEntityPrefixDef } from '../compiler/deserialization/ucd-entity-prefix-def.js';
import { UcdLib } from '../compiler/deserialization/ucd-lib.js';
import { CHURI_MODULE } from '../impl/module-names.js';
import { TimestampUcrxMethod } from '../spec/timestamp.ucrx-method.js';
import { UC_TOKEN_EXCLAMATION_MARK } from '../syntax/uc-token.js';
import { UcEntity } from './uc-entity.js';
import { UcErrorInfo } from './uc-error.js';

describe('UcEntity', () => {
  const entity = new UcEntity('!foo%20bar');
  const TimestampEntityDef: UcdEntityPrefixDef = {
    entityPrefix: '!timestamp:',
    methods: TimestampUcrxMethod,
    addHandler({ lib, prefix, suffix }) {
      return code => {
        const printTokens = lib.import(CHURI_MODULE, 'printUcTokens');
        const readTimestamp = lib.declarations.declare(
          'readTimestampEntity',
          (prefix, suffix) => code => {
            code
              .write(`${prefix}(reader, rx, _prefix, args) => {`)
              .indent(code => {
                code.write(
                  `const date = new Date(${printTokens}(args));`,
                  lib.ucrxMethod(TimestampUcrxMethod).call('rx', { value: 'date' }),
                );
              })
              .write(`}${suffix}`);
          },
        );

        code.write(`${prefix}${readTimestamp}${suffix}`);
      };
    },
  };

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

    it('extends base ucrx', async () => {
      const lib = new UcdLib({
        schemae: {
          readTimestamp: Number,
        },
        definitions: [...BasicUcdDefs, TimestampEntityDef],
      });
      const now = new Date();
      const { readTimestamp } = await lib.compile('sync').toDeserializers();

      expect(readTimestamp(`!timestamp:${now.toISOString()}`)).toBe(now.getTime());
    });

    it('fails without required ucrx method', async () => {
      const lib = new UcdLib({
        schemae: {
          readTimestamp: Number,
        },
        definitions: [
          ...BasicUcdDefs,
          {
            ...TimestampEntityDef,
            methods: [],
          },
        ],
      });

      await expect(lib.compile('sync').toDeserializers()).rejects.toThrow(
        new ReferenceError(`Unknown charge receiver method: Ucrx.date(value)`),
      );
    });
  });
});
