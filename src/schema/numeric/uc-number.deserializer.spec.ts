import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { ucdSupportNonFinite } from '../../compiler/deserialization/ucd-support-non-finite.js';
import { ucdSupportPrimitives } from '../../compiler/deserialization/ucd-support-primitives.js';
import { parseTokens, readTokens } from '../../spec/read-chunks.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { UcDataType } from '../uc-schema.js';
import { UcNumber, ucNumber } from './uc-number.js';

describe('UcNumber deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: UcErrorInfo[];

  beforeEach(() => {
    errors = [];
  });

  describe('by default', () => {
    let readValue: UcDeserializer<number>;

    beforeEach(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: Number as UcDataType<UcNumber>,
        },
        features: [ucdSupportPrimitives, ucdSupportNonFinite],
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('deserializes number', async () => {
      await expect(readValue(readTokens('123'))).resolves.toBe(123);
      await expect(readValue(readTokens('-123'))).resolves.toBe(-123);
    });
    it('deserializes number synchronously', async () => {
      const compiler = new UcdCompiler({
        models: {
          parseValue: Number,
        },
        mode: 'sync',
      });

      const { parseValue } = await compiler.evaluate();

      expect(parseValue(parseTokens('123'))).toBe(123);
      expect(parseValue(parseTokens('-123'))).toBe(-123);
    });
    it('deserializes number from string', async () => {
      const compiler = new UcdCompiler({
        models: {
          parseValue: Number,
        },
        mode: 'sync',
      });
      const { parseValue } = await compiler.evaluate();

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
    it('parses numeric string', async () => {
      await expect(readValue(readTokens("'1"), { onError })).resolves.toBe(1);
      await expect(readValue(readTokens("'-1"), { onError })).resolves.toBe(-1);
      expect(errors).toEqual([]);
    });
    it('parses Infinity string', async () => {
      await expect(readValue(readTokens("'Infinity"), { onError })).resolves.toBe(Infinity);
      await expect(readValue(readTokens("'-Infinity"), { onError })).resolves.toBe(-Infinity);
      expect(errors).toEqual([]);
    });
    it('parses NaN string', async () => {
      await expect(readValue(readTokens("'NaN"), { onError })).resolves.toBeNaN();
      expect(errors).toEqual([]);
    });
    it('rejects non-numeric string', async () => {
      await expect(readValue(readTokens("'abc"), { onError })).resolves.toBeUndefined();

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

  describe('when strings rejected', () => {
    let readValue: UcDeserializer<number>;

    beforeEach(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: ucNumber({ string: 'reject' }),
        },
        features: [ucdSupportPrimitives, ucdSupportNonFinite],
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('rejects numeric string', async () => {
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
  });
});
