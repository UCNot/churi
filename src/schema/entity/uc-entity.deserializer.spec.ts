import { beforeEach, describe, expect, it } from '@jest/globals';
import { BasicUcdDefs } from '../../compiler/deserialization/basic.ucd-defs.js';
import { UcdEntityPrefixDef } from '../../compiler/deserialization/ucd-entity-prefix-def.js';
import { UcdLib } from '../../compiler/deserialization/ucd-lib.js';
import { CHURI_MODULE } from '../../impl/module-names.js';
import { readTokens } from '../../spec/read-chunks.js';
import { TimestampUcrxMethod } from '../../spec/timestamp.ucrx-method.js';
import { UC_TOKEN_EXCLAMATION_MARK } from '../../syntax/uc-token.js';
import { UcErrorInfo } from '../uc-error.js';

describe('UcEntity deserializer', () => {
  const TimestampEntityDef: UcdEntityPrefixDef = {
    entityPrefix: '!timestamp:',
    methods: TimestampUcrxMethod,
    createRx({ lib, prefix, suffix }) {
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
                  'return ' + TimestampUcrxMethod.toMethod(lib).call('rx', { value: 'date' }) + ';',
                );
              })
              .write(`}${suffix}`);
          },
        );

        code.write(`${prefix}${readTimestamp}${suffix}`);
      };
    },
  };
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: unknown[];

  beforeEach(() => {
    errors = [];
  });

  it('(async) does not recognize unknown entity', async () => {
    const lib = new UcdLib({
      schemae: {
        readNumber: Number,
      },
      definitions: BasicUcdDefs,
    });

    const { readNumber } = await lib.compile('async').toDeserializers();

    await expect(readNumber(readTokens('!Infinity'), { onError })).resolves.toBeUndefined();
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
  it('(sync) does not recognize unknown entity', async () => {
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
          createRx({ lib, prefix, suffix }) {
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