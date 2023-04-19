import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdSetup } from '../../compiler/deserialization/ucd-setup.js';
import { ucdSupportPrimitives } from '../../compiler/deserialization/ucd-support-primitives.js';
import { readTokens } from '../../spec/read-chunks.js';
import { ucdSupportPlainEntity } from '../../spec/read-plain-entity.js';
import {
  ucdSupportTimestampEntity,
  ucdSupportTimestampEntityOnly,
} from '../../spec/timestamp.ucrx-method.js';
import { UC_TOKEN_EXCLAMATION_MARK } from '../../syntax/uc-token.js';
import { UcErrorInfo } from '../uc-error.js';

describe('UcEntity deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: unknown[];

  beforeEach(() => {
    errors = [];
  });

  it('(async) does not recognize unknown entity', async () => {
    const lib = await new UcdSetup({
      models: {
        readNumber: Number,
      },
      features: ucdSupportPrimitives,
    }).bootstrap();

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
    const lib = await new UcdSetup({
      models: {
        readNumber: Number,
      },
      features: ucdSupportPrimitives,
    }).bootstrap();

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
    const lib = await new UcdSetup({
      models: {
        readString: String,
      },
      features: [ucdSupportPrimitives, ucdSupportPlainEntity],
    }).bootstrap();
    const { readString } = await lib.compile('sync').toDeserializers();

    expect(readString("!plain'test")).toBe("!plain'test");
  });
  it('closes hanging parentheses', async () => {
    const lib = await new UcdSetup({
      models: {
        readString: String,
      },
      features: [ucdSupportPrimitives, ucdSupportPlainEntity],
    }).bootstrap();
    const { readString } = await lib.compile('async').toDeserializers();

    await expect(readString(readTokens('!plain(bar(item1,item2)baz('))).resolves.toBe(
      '!plain(bar(item1,item2)baz())',
    );
  });
  it('extends base ucrx', async () => {
    const lib = await new UcdSetup({
      models: {
        readTimestamp: Number,
      },
      features: [ucdSupportPrimitives, ucdSupportTimestampEntity],
    }).bootstrap();
    const now = new Date();
    const { readTimestamp } = await lib.compile('sync').toDeserializers();

    expect(readTimestamp(`!timestamp'${now.toISOString()}`)).toBe(now.getTime());
  });
  it('fails without required ucrx method', async () => {
    const lib = await new UcdSetup({
      models: {
        readTimestamp: Number,
      },
      features: [ucdSupportPrimitives, ucdSupportTimestampEntityOnly],
    }).bootstrap();

    await expect(lib.compile('sync').toDeserializers()).rejects.toThrow(
      new ReferenceError(`Unknown charge receiver method: Ucrx.date(value)`),
    );
  });
});
