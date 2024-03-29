import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { ucdProcessNonFinite } from '../../compiler/deserialization/ucd-process-non-finite.js';
import { ucdProcessPrimitives } from '../../compiler/deserialization/ucd-process-primitives.js';
import { parseTokens } from '../../spec/read-chunks.js';
import { UcChargeLexer } from '../../syntax/formats/charge/uc-charge.lexer.js';
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
    let readValue: UcDeserializer.ByTokens<number>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: Number as UcDataType<UcNumber>,
            byTokens: true,
          },
        },
        features: [ucdProcessPrimitives, ucdProcessNonFinite],
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('deserializes number', async () => {
      await expect(readValue(parseTokens('123'))).resolves.toBe(123);
      await expect(readValue(parseTokens('-123'))).resolves.toBe(-123);
    });
    it('deserializes number synchronously', async () => {
      const compiler = new UcdCompiler({
        models: {
          parseValue: { model: Number, mode: 'sync' },
        },
      });

      const { parseValue } = await compiler.evaluate();

      expect(parseValue(UcChargeLexer.scan('123'))).toBe(123);
      expect(parseValue(UcChargeLexer.scan('-123'))).toBe(-123);
    });
    it('deserializes number from string', async () => {
      const compiler = new UcdCompiler({
        models: {
          parseValue: { model: Number, mode: 'sync' },
        },
      });
      const { parseValue } = await compiler.evaluate();

      expect(parseValue('123')).toBe(123);
      expect(parseValue('-123')).toBe(-123);
    });
    it('deserializes percent-encoded number', async () => {
      await expect(readValue(parseTokens('%3123'))).resolves.toBe(123);
      await expect(readValue(parseTokens('%2D%3123'))).resolves.toBe(-123);
    });
    it('deserializes hexadecimal number', async () => {
      await expect(readValue(parseTokens('0x123'))).resolves.toBe(0x123);
      await expect(readValue(parseTokens('-0x123'))).resolves.toBe(-0x123);
    });
    it('deserializes zero', async () => {
      await expect(readValue(parseTokens('0'))).resolves.toBe(0);
      await expect(readValue(parseTokens('-0'))).resolves.toBe(-0);
    });
    it('rejects NaN', async () => {
      await expect(readValue(parseTokens('0xz'), { onError })).resolves.toBeUndefined();

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
      await expect(readValue(parseTokens('0n1'), { onError })).resolves.toBeUndefined();

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
      await expect(readValue(parseTokens('-'), { onError })).resolves.toBeUndefined();

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
      await expect(readValue(parseTokens("'1"), { onError })).resolves.toBe(1);
      await expect(readValue(parseTokens("'-1"), { onError })).resolves.toBe(-1);
      expect(errors).toEqual([]);
    });
    it('parses Infinity string', async () => {
      await expect(readValue(parseTokens("'Infinity"), { onError })).resolves.toBe(Infinity);
      await expect(readValue(parseTokens("'-Infinity"), { onError })).resolves.toBe(-Infinity);
      expect(errors).toEqual([]);
    });
    it('parses NaN string', async () => {
      await expect(readValue(parseTokens("'NaN"), { onError })).resolves.toBeNaN();
      expect(errors).toEqual([]);
    });
    it('rejects non-numeric string', async () => {
      await expect(readValue(parseTokens("'abc"), { onError })).resolves.toBeUndefined();

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
      await expect(readValue(parseTokens('!Infinity'))).resolves.toBe(Infinity);
    });
    it('deserializes negative infinity', async () => {
      await expect(readValue(parseTokens('!-Infinity'))).resolves.toBe(-Infinity);
    });
    it('deserializes NaN', async () => {
      await expect(readValue(parseTokens('!NaN'))).resolves.toBeNaN();
    });
  });

  describe('when strings rejected', () => {
    let readValue: UcDeserializer.ByTokens<number>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucNumber({ string: 'reject' }),
            byTokens: true,
          },
        },
        features: [ucdProcessPrimitives, ucdProcessNonFinite],
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('rejects numeric string', async () => {
      await expect(readValue(parseTokens("'1"), { onError })).resolves.toBeUndefined();

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
