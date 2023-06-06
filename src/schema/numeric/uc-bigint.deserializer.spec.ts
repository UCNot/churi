import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdSetup } from '../../compiler/deserialization/ucd-setup.js';
import { readTokens } from '../../spec/read-chunks.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { UcModel } from '../uc-schema.js';

describe('UcBigInt deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: UcErrorInfo[];

  beforeEach(() => {
    errors = [];
  });

  let setup: UcdSetup<{ readValue: UcModel<bigint> }>;
  let readValue: UcDeserializer<bigint>;

  beforeEach(async () => {
    setup = new UcdSetup({
      models: {
        readValue: BigInt,
      },
    });
    ({ readValue } = await setup.evaluate());
  });

  it('deserializes number', async () => {
    await expect(readValue(readTokens(' 0n123   '))).resolves.toBe(123n);
    await expect(readValue(readTokens('-0n123'))).resolves.toBe(-123n);
  });
  it('deserializes hexadecimal number', async () => {
    await expect(readValue(readTokens('0n0x123'))).resolves.toBe(0x123n);
    await expect(readValue(readTokens('-0n0x123'))).resolves.toBe(-0x123n);
  });
  it('deserializes zero', async () => {
    await expect(readValue(readTokens('0n0'))).resolves.toBe(0n);
    await expect(readValue(readTokens('-0n0'))).resolves.toBe(-0n);
    await expect(readValue(readTokens('0n'))).resolves.toBe(0n);
    await expect(readValue(readTokens('-0n'))).resolves.toBe(-0n);
  });
  it('rejects NaN', async () => {
    await expect(readValue(readTokens('0nz'), { onError })).resolves.toBeUndefined();

    expect(errors).toEqual([
      {
        code: 'invalidSyntax',
        path: [{}],
        details: { type: 'bigint' },
        message: 'Cannot convert z to a BigInt',
        cause: new SyntaxError('Cannot convert z to a BigInt'),
      },
    ]);
  });
  it('rejects number', async () => {
    await expect(readValue(readTokens('123'), { onError })).resolves.toBeUndefined();

    expect(errors).toEqual([
      {
        code: 'unexpectedType',
        path: [{}],
        details: { type: 'number', expected: { types: ['bigint'] } },
        message: 'Unexpected number instead of bigint',
      },
    ]);
  });
});
