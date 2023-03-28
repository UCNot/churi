import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdLib } from '../../compiler/deserialization/ucd-lib.js';
import { readTokens } from '../../spec/read-chunks.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { ucNullable } from '../uc-nullable.js';
import { UcSchema } from '../uc-schema.js';

describe('UcBoolean deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: UcErrorInfo[];

  beforeEach(() => {
    errors = [];
  });

  let lib: UcdLib<{ readValue: UcSchema.Spec<boolean> }>;
  let readValue: UcDeserializer<boolean>;

  beforeEach(async () => {
    lib = new UcdLib({
      schemae: {
        readValue: Boolean,
      },
    });
    ({ readValue } = await lib.compile().toDeserializers());
  });

  it('deserializes boolean', async () => {
    await expect(readValue(readTokens('!'))).resolves.toBe(true);
    await expect(readValue(readTokens(' ! '))).resolves.toBe(true);
    await expect(readValue(readTokens('-'))).resolves.toBe(false);
    await expect(readValue(readTokens(' -  '))).resolves.toBe(false);
  });
  it('rejects null', async () => {
    await expect(readValue(readTokens('--'), { onError })).resolves.toBeUndefined();

    expect(errors).toEqual([
      {
        code: 'unexpectedType',
        details: {
          type: 'null',
          expected: {
            types: ['boolean'],
          },
        },
        message: 'Unexpected null, while boolean expected',
      },
    ]);
  });
  it('rejects nested list', async () => {
    await expect(readValue(readTokens('()'), { onError })).resolves.toBeUndefined();

    expect(errors).toEqual([
      {
        code: 'unexpectedType',
        details: {
          type: 'nested list',
          expected: {
            types: ['boolean'],
          },
        },
        message: 'Unexpected nested list, while boolean expected',
      },
    ]);
  });
  it('rejects second item', async () => {
    await expect(readValue(readTokens('!,-'), { onError })).resolves.toBe(true);

    expect(errors).toEqual([
      {
        code: 'unexpectedType',
        details: {
          type: 'list',
          expected: {
            types: ['boolean'],
          },
        },
        message: 'Unexpected list, while boolean expected',
      },
    ]);
  });

  describe('nullable', () => {
    let lib: UcdLib<{ readValue: UcSchema.Spec<boolean | null> }>;
    let readValue: UcDeserializer<boolean | null>;

    beforeEach(async () => {
      lib = new UcdLib({
        schemae: {
          readValue: ucNullable<boolean>(Boolean),
        },
      });
      ({ readValue } = await lib.compile().toDeserializers());
    });

    it('deserializes boolean', async () => {
      await expect(readValue(readTokens('!'))).resolves.toBe(true);
      await expect(readValue(readTokens(' ! '))).resolves.toBe(true);
      await expect(readValue(readTokens('-'))).resolves.toBe(false);
      await expect(readValue(readTokens(' -  '))).resolves.toBe(false);
    });
    it('deserializes null', async () => {
      await expect(readValue(readTokens('--'))).resolves.toBeNull();
      await expect(readValue(readTokens('   --'))).resolves.toBeNull();
      await expect(readValue(readTokens('--   \r\n'))).resolves.toBeNull();
    });
    it('rejects number', async () => {
      await expect(readValue(readTokens('-1'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: {
            type: 'number',
            expected: {
              types: ['boolean', 'null'],
            },
          },
          message: 'Unexpected number, while boolean or null expected',
        },
      ]);
    });
  });
});
