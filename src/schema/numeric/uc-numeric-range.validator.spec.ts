import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { UcSchema } from '../uc-schema.js';
import { ucBigInt } from './uc-bigint.js';
import { ucNumber } from './uc-number.js';
import { ucGreaterThan, ucLessThan, ucMax, ucMin } from './uc-numeric-range.validator.js';

describe('number range validator', () => {
  let errors: UcErrorInfo[];
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };

  beforeEach(() => {
    errors = [];
  });

  describe('ucMin', () => {
    let readValue: UcDeserializer.Sync<number>;

    beforeAll(async () => {
      readValue = await compile(ucNumber(ucMin(10)));
    });

    it('rejects lesser number', () => {
      expect(readValue('9', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'tooSmall',
          path: [{}],
          details: {
            min: 10,
            inclusive: true,
          },
          message: 'At least 10 expected',
        },
      ]);
    });
    it('accepts greater or equal number', () => {
      expect(readValue('10', { onError })).toBe(10);
      expect(readValue('11', { onError })).toBe(11);
      expect(errors).toEqual([]);
    });
    it('supports custom message', async () => {
      const readValue = await compile(ucNumber(ucMin(10, 'Wrong!')));

      expect(readValue('0', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'tooSmall',
          path: [{}],
          details: {
            min: 10,
            inclusive: true,
          },
          message: 'Wrong!',
        },
      ]);
    });
  });

  describe('ucGreaterThan', () => {
    let readValue: UcDeserializer.Sync<number>;

    beforeAll(async () => {
      readValue = await compile(ucNumber(ucGreaterThan(10)));
    });

    it('rejects lesser number', () => {
      expect(readValue('9', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'tooSmall',
          path: [{}],
          details: {
            min: 10,
            inclusive: false,
          },
          message: 'Greater than 10 expected',
        },
      ]);
    });
    it('rejects equal number', () => {
      expect(readValue('10', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'tooSmall',
          path: [{}],
          details: {
            min: 10,
            inclusive: false,
          },
          message: 'Greater than 10 expected',
        },
      ]);
    });
    it('accepts greater number', () => {
      expect(readValue('11', { onError })).toBe(11);
      expect(errors).toEqual([]);
    });
  });

  describe('ucMax', () => {
    let readValue: UcDeserializer.Sync<number>;

    beforeAll(async () => {
      readValue = await compile(ucNumber(ucMax(10)));
    });

    it('rejects greater number', () => {
      expect(readValue('11', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'tooBig',
          path: [{}],
          details: {
            max: 10,
            inclusive: true,
          },
          message: 'At most 10 expected',
        },
      ]);
    });
    it('accepts lesser or equal number', () => {
      expect(readValue('10', { onError })).toBe(10);
      expect(readValue('9', { onError })).toBe(9);
      expect(errors).toEqual([]);
    });
  });

  describe('ucLessThan', () => {
    let readValue: UcDeserializer.Sync<number>;

    beforeAll(async () => {
      readValue = await compile(ucNumber(ucLessThan(10)));
    });

    it('rejects greater number', () => {
      expect(readValue('11', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'tooBig',
          path: [{}],
          details: {
            max: 10,
            inclusive: false,
          },
          message: 'Less than 10 expected',
        },
      ]);
    });
    it('rejects equal number', () => {
      expect(readValue('10', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'tooBig',
          path: [{}],
          details: {
            max: 10,
            inclusive: false,
          },
          message: 'Less than 10 expected',
        },
      ]);
    });
    it('accepts lesser number', () => {
      expect(readValue('9', { onError })).toBe(9);
      expect(errors).toEqual([]);
    });
  });

  async function compile(schema: UcSchema<number>): Promise<UcDeserializer.Sync<number>> {
    const compiler = new UcdCompiler({ models: { readValue: schema }, mode: 'sync' });
    const { readValue } = await compiler.evaluate();

    return readValue;
  }
});

describe('bigint range validator', () => {
  let errors: UcErrorInfo[];
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };

  beforeEach(() => {
    errors = [];
  });

  describe('ucMin', () => {
    let readValue: UcDeserializer.Sync<bigint>;

    beforeAll(async () => {
      readValue = await compile(ucBigInt(ucMin(10)));
    });

    it('rejects lesser number', () => {
      expect(readValue('0n9', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'tooSmall',
          path: [{}],
          details: {
            min: 10n,
            inclusive: true,
          },
          message: 'At least 10 expected',
        },
      ]);
    });
    it('accepts greater or equal number', () => {
      expect(readValue('0n10', { onError })).toBe(10n);
      expect(readValue('0n11', { onError })).toBe(11n);
      expect(errors).toEqual([]);
    });
  });

  describe('ucMin with bigint bound', () => {
    let readValue: UcDeserializer.Sync<bigint>;

    beforeAll(async () => {
      readValue = await compile(ucBigInt(ucMin(10n)));
    });

    it('rejects lesser bigint', () => {
      expect(readValue('0n9', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'tooSmall',
          path: [{}],
          details: {
            min: 10n,
            inclusive: true,
          },
          message: 'At least 10 expected',
        },
      ]);
    });
    it('accepts greater or equal bigint', () => {
      expect(readValue('0n10', { onError })).toBe(10n);
      expect(readValue('0n11', { onError })).toBe(11n);
      expect(errors).toEqual([]);
    });
  });

  describe('ucGreaterThan', () => {
    let readValue: UcDeserializer.Sync<bigint>;

    beforeAll(async () => {
      readValue = await compile(ucBigInt(ucGreaterThan(10)));
    });

    it('rejects lesser number', () => {
      expect(readValue('0n9', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'tooSmall',
          path: [{}],
          details: {
            min: 10n,
            inclusive: false,
          },
          message: 'Greater than 10 expected',
        },
      ]);
    });
    it('rejects equal number', () => {
      expect(readValue('0n10', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'tooSmall',
          path: [{}],
          details: {
            min: 10n,
            inclusive: false,
          },
          message: 'Greater than 10 expected',
        },
      ]);
    });
    it('accepts greater number', () => {
      expect(readValue('0n11', { onError })).toBe(11n);
      expect(errors).toEqual([]);
    });
  });

  describe('ucMax', () => {
    let readValue: UcDeserializer.Sync<bigint>;

    beforeAll(async () => {
      readValue = await compile(ucBigInt(ucMax(10)));
    });

    it('rejects greater number', () => {
      expect(readValue('0n11', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'tooBig',
          path: [{}],
          details: {
            max: 10n,
            inclusive: true,
          },
          message: 'At most 10 expected',
        },
      ]);
    });
    it('accepts lesser or equal number', () => {
      expect(readValue('0n10', { onError })).toBe(10n);
      expect(readValue('0n9', { onError })).toBe(9n);
      expect(errors).toEqual([]);
    });
  });

  describe('ucLessThan', () => {
    let readValue: UcDeserializer.Sync<bigint>;

    beforeAll(async () => {
      readValue = await compile(ucBigInt(ucLessThan(10)));
    });

    it('rejects greater number', () => {
      expect(readValue('0n11', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'tooBig',
          path: [{}],
          details: {
            max: 10n,
            inclusive: false,
          },
          message: 'Less than 10 expected',
        },
      ]);
    });
    it('rejects equal number', () => {
      expect(readValue('0n10', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'tooBig',
          path: [{}],
          details: {
            max: 10n,
            inclusive: false,
          },
          message: 'Less than 10 expected',
        },
      ]);
    });
    it('accepts lesser number', () => {
      expect(readValue('0n9', { onError })).toBe(9n);
      expect(errors).toEqual([]);
    });
  });

  async function compile(schema: UcSchema<bigint>): Promise<UcDeserializer.Sync<bigint>> {
    const compiler = new UcdCompiler({ models: { readValue: schema }, mode: 'sync' });
    const { readValue } = await compiler.evaluate();

    return readValue;
  }
});
