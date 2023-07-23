import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { ucNullable } from '../uc-nullable.js';
import { UcInteger, ucInteger } from './uc-integer.js';

describe('UcInteger deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: UcErrorInfo[];

  beforeEach(() => {
    errors = [];
  });

  describe('by default', () => {
    let readValue: UcDeserializer<UcInteger>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: { model: ucInteger() },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('deserializes integer', () => {
      expect(readValue('123')).toBe(123);
      expect(readValue('0')).toBe(0);
      expect(readValue('-123')).toBe(-123);
    });
    it('deserializes float as integer', () => {
      expect(readValue('123.45')).toBe(123);
      expect(readValue('12e34')).toBe(12);
      expect(readValue('-123.45')).toBe(-123);
    });
    it('deserializes hex integer', () => {
      expect(readValue('0x123')).toBe(0x123);
      expect(readValue('0x0')).toBe(0);
      expect(readValue('-0x123')).toBe(-0x123);
    });
    it('rejects non-numeric value', () => {
      expect(readValue('e10', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'string',
            expected: {
              types: ['integer'],
            },
          },
          message: 'Unexpected string instead of integer',
        },
      ]);
    });
    it('does not recognize binary and octal literals', () => {
      expect(readValue('0b001')).toBe(0);
      expect(readValue('0o001')).toBe(0);
    });
    it('does not recognize bigint literal', () => {
      expect(readValue('0n001')).toBe(0);
    });
    it('parses integer string', () => {
      expect(readValue("'1", { onError })).toBe(1);
      expect(readValue("'-1", { onError })).toBe(-1);
      expect(errors).toEqual([]);
    });
    it('rejects null', () => {
      expect(readValue('--', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'null',
            expected: {
              types: ['integer'],
            },
          },
          message: 'Unexpected null instead of integer',
        },
      ]);
    });
    it('rejects Infinity', () => {
      expect(readValue('!Infinity', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'float',
            expected: {
              types: ['integer'],
            },
          },
          message: 'Unexpected float instead of integer',
        },
      ]);
    });
    it('rejects NaN', () => {
      expect(readValue('!NaN', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'float',
            expected: {
              types: ['integer'],
            },
          },
          message: 'Unexpected float instead of integer',
        },
      ]);
    });
  });

  describe('when string parsed', () => {
    let readValue: UcDeserializer<UcInteger>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: { model: ucInteger({}) },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('parses integer string', () => {
      expect(readValue("'1", { onError })).toBe(1);
      expect(readValue("'-1", { onError })).toBe(-1);
      expect(errors).toEqual([]);
    });
  });

  describe('when nullable', () => {
    let readValue: UcDeserializer<number | null>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: { model: ucNullable(ucInteger()) },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('deserializes integer', () => {
      expect(readValue('123')).toBe(123);
      expect(readValue('0')).toBe(0);
      expect(readValue('-123')).toBe(-123);
    });
    it('deserializes float as integer', () => {
      expect(readValue('123.45')).toBe(123);
      expect(readValue('12e34')).toBe(12);
      expect(readValue('-123.45')).toBe(-123);
    });
    it('deserializes hex integer', () => {
      expect(readValue('0x123')).toBe(0x123);
      expect(readValue('0x0')).toBe(0);
      expect(readValue('-0x123')).toBe(-0x123);
    });
    it('deserializes null', () => {
      expect(readValue('--')).toBeNull();
    });
    it('does not recognize binary and octal literals', () => {
      expect(readValue('0b001')).toBe(0);
      expect(readValue('0o001')).toBe(0);
    });
    it('does not recognize bigint literal', () => {
      expect(readValue('0n001')).toBe(0);
    });
    it('rejects non-numeric value', () => {
      expect(readValue('e10', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'string',
            expected: {
              types: ['integer', 'null'],
            },
          },
          message: 'Unexpected string instead of integer or null',
        },
      ]);
    });
    it('parses integer string', () => {
      expect(readValue("'1", { onError })).toBe(1);
      expect(readValue("'-1", { onError })).toBe(-1);
      expect(errors).toEqual([]);
    });
    it('rejects Infinity', () => {
      expect(readValue('!Infinity', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'float',
            expected: {
              types: ['integer', 'null'],
            },
          },
          message: 'Unexpected float instead of integer or null',
        },
      ]);
    });
    it('rejects NaN', () => {
      expect(readValue('!NaN', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'float',
            expected: {
              types: ['integer', 'null'],
            },
          },
          message: 'Unexpected float instead of integer or null',
        },
      ]);
    });
  });

  describe('when strings rejected', () => {
    let readValue: UcDeserializer<number>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: { model: ucInteger({ string: 'reject' }) },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('rejects numeric string', () => {
      expect(readValue("'1", { onError })).toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: { type: 'string', expected: { types: ['integer'] } },
          message: 'Unexpected string instead of integer',
        },
      ]);
    });
  });
});
