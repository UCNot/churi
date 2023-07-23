import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { readTokens } from '../../spec/read-chunks.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { ucNullable } from '../uc-nullable.js';
import { ucBigInt } from './uc-bigint.js';

describe('UcBigInt deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: UcErrorInfo[];

  beforeEach(() => {
    errors = [];
  });

  describe('by default', () => {
    let readValue: UcDeserializer<bigint>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: { model: BigInt },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('deserializes bigint', async () => {
      await expect(readValue(readTokens(' 0n123   '))).resolves.toBe(123n);
      await expect(readValue(readTokens('-0n123'))).resolves.toBe(-123n);
    });
    it('deserializes hexadecimal bigint', async () => {
      await expect(readValue(readTokens('0n0x123'))).resolves.toBe(0x123n);
      await expect(readValue(readTokens('-0n0x123'))).resolves.toBe(-0x123n);
    });
    it('deserializes bigint zero', async () => {
      await expect(readValue(readTokens('0n0'))).resolves.toBe(0n);
      await expect(readValue(readTokens('-0n0'))).resolves.toBe(-0n);
      await expect(readValue(readTokens('0n'))).resolves.toBe(0n);
      await expect(readValue(readTokens('-0n'))).resolves.toBe(-0n);
    });
    it('rejects null', async () => {
      await expect(readValue(readTokens('--'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: { type: 'null', expected: { types: ['bigint'] } },
          message: 'Unexpected null instead of bigint',
        },
      ]);
    });
    it('rejects malformed bigint', async () => {
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
    it('rejects malformed number', async () => {
      await expect(readValue(readTokens('1z'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'invalidSyntax',
          path: [{}],
          details: { type: 'bigint' },
          message: 'Cannot convert 1z to a BigInt',
          cause: new SyntaxError('Cannot convert 1z to a BigInt'),
        },
      ]);
    });
    it('parses number', async () => {
      await expect(readValue(readTokens('123'), { onError })).resolves.toBe(123n);
      await expect(readValue(readTokens('-123'), { onError })).resolves.toBe(-123n);
      await expect(readValue(readTokens('0x123'), { onError })).resolves.toBe(0x123n);
      await expect(readValue(readTokens('-0x123'), { onError })).resolves.toBe(-0x123n);
    });
    it('parses numeric string without 0n prefix', async () => {
      await expect(readValue(readTokens("'123"), { onError })).resolves.toBe(123n);
      await expect(readValue(readTokens("'-123"), { onError })).resolves.toBe(-123n);
      await expect(readValue(readTokens("'0x123"), { onError })).resolves.toBe(0x123n);
      await expect(readValue(readTokens("'-0x123"), { onError })).resolves.toBe(-0x123n);
    });
    it('parses numeric string with 0n prefix', async () => {
      await expect(readValue(readTokens("'0n123"), { onError })).resolves.toBe(123n);
      await expect(readValue(readTokens("'-0n123"), { onError })).resolves.toBe(-123n);
      await expect(readValue(readTokens("'0n0x123"), { onError })).resolves.toBe(0x123n);
      await expect(readValue(readTokens("'-0n0x123"), { onError })).resolves.toBe(-0x123n);
    });
    it('rejects malformed bigint string', async () => {
      await expect(readValue(readTokens("'0nz"), { onError })).resolves.toBeUndefined();

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
    it('rejects malformed number string', async () => {
      await expect(readValue(readTokens("'1z"), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'invalidSyntax',
          path: [{}],
          details: { type: 'bigint' },
          message: 'Cannot convert 1z to a BigInt',
          cause: new SyntaxError('Cannot convert 1z to a BigInt'),
        },
      ]);
    });

    describe('when strings rejected', () => {
      let readValue: UcDeserializer<bigint>;

      beforeAll(async () => {
        const compiler = new UcdCompiler({
          models: {
            readValue: { model: ucBigInt({ string: 'reject' }) },
          },
        });

        ({ readValue } = await compiler.evaluate());
      });

      it('rejects numeric string without 0n prefix', async () => {
        await expect(readValue(readTokens("'123"), { onError })).resolves.toBeUndefined();

        expect(errors).toEqual([
          {
            code: 'unexpectedType',
            path: [{}],
            details: { type: 'string', expected: { types: ['bigint'] } },
            message: 'Unexpected string instead of bigint',
          },
        ]);
      });
      it('rejects numeric string with 0n prefix', async () => {
        await expect(readValue(readTokens("'0n123"), { onError })).resolves.toBeUndefined();

        expect(errors).toEqual([
          {
            code: 'unexpectedType',
            path: [{}],
            details: { type: 'string', expected: { types: ['bigint'] } },
            message: 'Unexpected string instead of bigint',
          },
        ]);
      });
    });
  });

  describe('when nullable', () => {
    let readValue: UcDeserializer<bigint | null>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: { model: ucNullable(BigInt) },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('deserializes bigint', async () => {
      await expect(readValue(readTokens(' 0n123   '))).resolves.toBe(123n);
      await expect(readValue(readTokens('-0n123'))).resolves.toBe(-123n);
    });
    it('deserializes null', async () => {
      await expect(readValue(readTokens(' --   '))).resolves.toBeNull();
    });
  });

  describe('when numbers rejected', () => {
    let readValue: UcDeserializer<bigint>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: { model: ucBigInt({ number: 'reject' }) },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('deserializes bigint', async () => {
      await expect(readValue(readTokens(' 0n123   '))).resolves.toBe(123n);
      await expect(readValue(readTokens('-0n123'))).resolves.toBe(-123n);
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
    it('rejects negative number', async () => {
      await expect(readValue(readTokens('-123'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: { type: 'number', expected: { types: ['bigint'] } },
          message: 'Unexpected number instead of bigint',
        },
      ]);
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
    it('rejects numeric string without 0n prefix', async () => {
      await expect(readValue(readTokens("'123"), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: { type: 'string', expected: { types: ['bigint'] } },
          message: 'Unexpected string instead of bigint',
        },
      ]);
    });
    it('rejects negative numeric string without 0n prefix', async () => {
      await expect(readValue(readTokens("'-123"), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: { type: 'string', expected: { types: ['bigint'] } },
          message: 'Unexpected string instead of bigint',
        },
      ]);
    });
    it('parses numeric string with 0n prefix', async () => {
      await expect(readValue(readTokens("'0n123"), { onError })).resolves.toBe(123n);
      await expect(readValue(readTokens("'-0n123"), { onError })).resolves.toBe(-123n);
      await expect(readValue(readTokens("'0n0x123"), { onError })).resolves.toBe(0x123n);
      await expect(readValue(readTokens("'-0n0x123"), { onError })).resolves.toBe(-0x123n);
    });
    it('rejects malformed bigint string', async () => {
      await expect(readValue(readTokens("'0nz"), { onError })).resolves.toBeUndefined();

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

    describe('when strings rejected', () => {
      let readValue: UcDeserializer<bigint>;

      beforeAll(async () => {
        const compiler = new UcdCompiler({
          models: {
            readValue: { model: ucBigInt({ string: 'reject', number: 'reject' }) },
          },
        });

        ({ readValue } = await compiler.evaluate());
      });

      it('rejects numeric string without 0n prefix', async () => {
        await expect(readValue(readTokens("'123"), { onError })).resolves.toBeUndefined();

        expect(errors).toEqual([
          {
            code: 'unexpectedType',
            path: [{}],
            details: { type: 'string', expected: { types: ['bigint'] } },
            message: 'Unexpected string instead of bigint',
          },
        ]);
      });
      it('rejects numeric string with 0n prefix', async () => {
        await expect(readValue(readTokens("'0n123"), { onError })).resolves.toBeUndefined();

        expect(errors).toEqual([
          {
            code: 'unexpectedType',
            path: [{}],
            details: { type: 'string', expected: { types: ['bigint'] } },
            message: 'Unexpected string instead of bigint',
          },
        ]);
      });
    });
  });
});
