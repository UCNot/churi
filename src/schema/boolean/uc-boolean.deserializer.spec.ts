import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { UcdModels } from '../../compiler/deserialization/ucd-models.js';
import { parseTokens } from '../../spec/read-chunks.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { ucNullable } from '../uc-nullable.js';
import { UcModel } from '../uc-schema.js';

describe('UcBoolean deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: UcErrorInfo[];

  beforeEach(() => {
    errors = [];
  });

  let readValue: UcDeserializer.ByTokens<boolean>;

  beforeAll(async () => {
    const compiler = new UcdCompiler<{ readValue: UcdModels.UniversalEntry<UcModel<boolean>> }>({
      models: {
        readValue: { model: Boolean },
      },
    });

    ({ readValue } = await compiler.evaluate());
  });

  it('deserializes boolean', async () => {
    await expect(readValue(parseTokens('!'))).resolves.toBe(true);
    await expect(readValue(parseTokens(' ! '))).resolves.toBe(true);
    await expect(readValue(parseTokens('-'))).resolves.toBe(false);
    await expect(readValue(parseTokens(' -  '))).resolves.toBe(false);
  });
  it('rejects null', async () => {
    await expect(readValue(parseTokens('--'), { onError })).resolves.toBeUndefined();

    expect(errors).toEqual([
      {
        code: 'unexpectedType',
        path: [{}],
        details: {
          type: 'null',
          expected: {
            types: ['boolean'],
          },
        },
        message: 'Unexpected null instead of boolean',
      },
    ]);
  });
  it('rejects nested list', async () => {
    await expect(readValue(parseTokens('()'), { onError })).resolves.toBeUndefined();

    expect(errors).toEqual([
      {
        code: 'unexpectedType',
        path: [
          {
            index: 0,
          },
        ],
        details: {
          type: 'nested list',
          expected: {
            types: ['boolean'],
          },
        },
        message: 'Unexpected nested list instead of boolean',
      },
    ]);
  });
  it('rejects second item', async () => {
    await expect(readValue(parseTokens('!,-'), { onError })).resolves.toBeUndefined();

    expect(errors).toEqual([
      {
        code: 'unexpectedType',
        path: [{ index: 1 }],
        details: {
          type: 'list',
          expected: {
            types: ['boolean'],
          },
        },
        message: 'Unexpected list instead of boolean',
      },
    ]);
  });

  describe('nullable', () => {
    let readValue: UcDeserializer.ByTokens<boolean | null>;

    beforeAll(async () => {
      const compiler = new UcdCompiler<{
        readValue: UcdModels.UniversalEntry<UcModel<boolean | null>>;
      }>({
        models: {
          readValue: { model: ucNullable<boolean>(Boolean) },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('deserializes boolean', async () => {
      await expect(readValue(parseTokens('!'))).resolves.toBe(true);
      await expect(readValue(parseTokens(' ! '))).resolves.toBe(true);
      await expect(readValue(parseTokens('-'))).resolves.toBe(false);
      await expect(readValue(parseTokens(' -  '))).resolves.toBe(false);
    });
    it('deserializes null', async () => {
      await expect(readValue(parseTokens('--'))).resolves.toBeNull();
      await expect(readValue(parseTokens('   --'))).resolves.toBeNull();
      await expect(readValue(parseTokens('--   \r\n'))).resolves.toBeNull();
    });
    it('rejects number', async () => {
      await expect(readValue(parseTokens('-1'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'number',
            expected: {
              types: ['boolean', 'null'],
            },
          },
          message: 'Unexpected number instead of boolean or null',
        },
      ]);
    });
  });
});
