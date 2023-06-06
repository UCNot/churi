import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdSetup } from '../../compiler/deserialization/ucd-setup.js';
import { ucdSupportNonFinite } from '../../compiler/deserialization/ucd-support-non-finite.js';
import { ucdSupportPrimitives } from '../../compiler/deserialization/ucd-support-primitives.js';
import { parseTokens, readTokens } from '../../spec/read-chunks.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { UcModel } from '../uc-schema.js';

describe('UcNumber deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: UcErrorInfo[];

  beforeEach(() => {
    errors = [];
  });

  let setup: UcdSetup<{ readValue: UcModel<number> }>;
  let readValue: UcDeserializer<number>;

  beforeEach(async () => {
    setup = new UcdSetup({
      models: {
        readValue: Number,
      },
      features: [ucdSupportPrimitives, ucdSupportNonFinite],
    });
    ({ readValue } = await setup.evaluate());
  });

  it('deserializes number', async () => {
    await expect(readValue(readTokens('123'))).resolves.toBe(123);
    await expect(readValue(readTokens('-123'))).resolves.toBe(-123);
  });
  it('deserializes number synchronously', async () => {
    const setup = new UcdSetup({
      models: {
        parseValue: Number,
      },
      mode: 'sync',
    });

    const { parseValue } = await setup.evaluate();

    expect(parseValue(parseTokens('123'))).toBe(123);
    expect(parseValue(parseTokens('-123'))).toBe(-123);
  });
  it('deserializes number from string', async () => {
    const setup = new UcdSetup({
      models: {
        parseValue: Number,
      },
      mode: 'sync',
    });
    const { parseValue } = await setup.evaluate();

    expect(parseValue('123')).toBe(123);
    expect(parseValue('-123')).toBe(-123);
  });
  it('deserializes percent-encoded number', async () => {
    await expect(readValue(readTokens('%3123'))).resolves.toBe(123);
    await expect(readValue(readTokens('%2D%3123'))).resolves.toBe(-123);
  });
  it('deserializes hexadecimal number', async () => {
    await expect(readValue(readTokens('0x123'))).resolves.toBe(0x123);
    await expect(readValue(readTokens('-0x123'))).resolves.toBe(-0x123);
  });
  it('deserializes zero', async () => {
    await expect(readValue(readTokens('0'))).resolves.toBe(0);
    await expect(readValue(readTokens('-0'))).resolves.toBe(-0);
  });
  it('rejects NaN', async () => {
    await expect(readValue(readTokens('0xz'), { onError })).resolves.toBeUndefined();

    expect(errors).toEqual([
      {
        code: 'invalidSyntax',
        path: [{}],
        details: { type: 'number' },
        message: 'Not a number',
      },
    ]);
  });
  it('rejects bigint', async () => {
    await expect(readValue(readTokens('0n1'), { onError })).resolves.toBeUndefined();

    expect(errors).toEqual([
      {
        code: 'unexpectedType',
        path: [{}],
        details: { type: 'bigint', expected: { types: ['number'] } },
        message: 'Unexpected bigint instead of number',
      },
    ]);
  });
  it('rejects boolean', async () => {
    await expect(readValue(readTokens('-'), { onError })).resolves.toBeUndefined();

    expect(errors).toEqual([
      {
        code: 'unexpectedType',
        path: [{}],
        details: { type: 'boolean', expected: { types: ['number'] } },
        message: 'Unexpected boolean instead of number',
      },
    ]);
  });
  it('rejects string', async () => {
    await expect(readValue(readTokens("'1"), { onError })).resolves.toBeUndefined();

    expect(errors).toEqual([
      {
        code: 'unexpectedType',
        path: [{}],
        details: { type: 'string', expected: { types: ['number'] } },
        message: 'Unexpected string instead of number',
      },
    ]);
  });
  it('deserializes infinity', async () => {
    await expect(readValue(readTokens('!Infinity'))).resolves.toBe(Infinity);
  });
  it('deserializes negative infinity', async () => {
    await expect(readValue(readTokens('!-Infinity'))).resolves.toBe(-Infinity);
  });
  it('deserializes NaN', async () => {
    await expect(readValue(readTokens('!NaN'))).resolves.toBeNaN();
  });
});
