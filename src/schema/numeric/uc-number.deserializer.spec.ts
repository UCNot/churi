import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdLib } from '../../compiler/deserialization/ucd-lib.js';
import { ucdSupportBasic } from '../../compiler/deserialization/ucd-support-basic.js';
import { ucdSupportNonFinite } from '../../compiler/deserialization/ucd-support-non-finite.js';
import { parseTokens, readTokens } from '../../spec/read-chunks.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { UcSchema } from '../uc-schema.js';

describe('UcNumber deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: UcErrorInfo[];

  beforeEach(() => {
    errors = [];
  });

  let lib: UcdLib<{ readValue: UcSchema.Spec<number> }>;
  let readValue: UcDeserializer<number>;

  beforeEach(async () => {
    lib = new UcdLib({
      schemae: {
        readValue: Number,
      },
      features: [ucdSupportBasic, ucdSupportNonFinite],
    });
    ({ readValue } = await lib.compile().toDeserializers());
  });

  it('deserializes number', async () => {
    await expect(readValue(readTokens('123'))).resolves.toBe(123);
    await expect(readValue(readTokens('-123'))).resolves.toBe(-123);
  });
  it('deserializes number synchronously', async () => {
    const lib = new UcdLib({
      schemae: {
        parseValue: Number,
      },
    });

    const { parseValue } = await lib.compile('sync').toDeserializers();

    expect(parseValue(parseTokens('123'))).toBe(123);
    expect(parseValue(parseTokens('-123'))).toBe(-123);
  });
  it('deserializes number from string', async () => {
    const lib = new UcdLib({
      schemae: {
        parseValue: Number,
      },
    });

    const { parseValue } = await lib.compile('sync').toDeserializers();

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
