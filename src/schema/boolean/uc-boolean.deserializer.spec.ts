import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { readTokens } from '../../spec/read-chunks.js';
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

  let compiler: UcdCompiler<{ readValue: UcModel<boolean> }>;
  let readValue: UcDeserializer<boolean>;

  beforeEach(async () => {
    compiler = new UcdCompiler({
      models: {
        readValue: Boolean,
      },
    });
    ({ readValue } = await compiler.evaluate());
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
    await expect(readValue(readTokens('()'), { onError })).resolves.toBeUndefined();

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
    await expect(readValue(readTokens('!,-'), { onError })).resolves.toBeUndefined();

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
    let compiler: UcdCompiler<{ readValue: UcModel<boolean | null> }>;
    let readValue: UcDeserializer<boolean | null>;

    beforeEach(async () => {
      compiler = new UcdCompiler({
        models: {
          readValue: ucNullable<boolean>(Boolean),
        },
      });
      ({ readValue } = await compiler.evaluate());
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
