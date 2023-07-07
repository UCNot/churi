import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { UcSchema } from '../uc-schema.js';
import { ucBigInt } from './uc-bigint.js';
import { ucNumber } from './uc-number.js';
import {
  ucItIsGreaterThan,
  ucItIsLessThan,
  ucItsMax,
  ucItsMin,
} from './uc-numeric-range.validator.js';

describe('number range validator', () => {
  let errors: UcErrorInfo[];
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };

  beforeEach(() => {
    errors = [];
  });

  describe('ucItsMin', () => {
    let readValue: UcDeserializer.Sync<number>;

    beforeAll(async () => {
      readValue = await compile(ucNumber({ where: ucItsMin(10) }));
    });

    it('rejects lesser number', () => {
      expect(readValue('9', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItsMin',
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
      const readValue = await compile(ucNumber({ where: ucItsMin(10, 'Wrong!') }));

      expect(readValue('0', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItsMin',
            min: 10,
            inclusive: true,
          },
          message: 'Wrong!',
        },
      ]);
    });
  });

  describe('ucItIsGreaterThan', () => {
    let readValue: UcDeserializer.Sync<number>;

    beforeAll(async () => {
      readValue = await compile(ucNumber({ where: ucItIsGreaterThan(10) }));
    });

    it('rejects lesser number', () => {
      expect(readValue('9', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItIsGreaterThan',
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
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItIsGreaterThan',
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

  describe('ucItsMax', () => {
    let readValue: UcDeserializer.Sync<number>;

    beforeAll(async () => {
      readValue = await compile(ucNumber({ where: ucItsMax(10) }));
    });

    it('rejects greater number', () => {
      expect(readValue('11', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItsMax',
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

  describe('ucItIsLessThan', () => {
    let readValue: UcDeserializer.Sync<number>;

    beforeAll(async () => {
      readValue = await compile(ucNumber({ where: ucItIsLessThan(10) }));
    });

    it('rejects greater number', () => {
      expect(readValue('11', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItIsLessThan',
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
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItIsLessThan',
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

  describe('multiple conditions', () => {
    let readValue: UcDeserializer.Sync<number>;

    beforeAll(async () => {
      readValue = await compile(ucNumber({ where: [ucItsMax(9), ucItIsLessThan(10)] }));
    });

    it('reports multiple violations', () => {
      expect(readValue('10', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItsMax',
            max: 9,
            inclusive: true,
          },
          message: 'At most 9 expected',
        },
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItIsLessThan',
            max: 10,
            inclusive: false,
          },
          message: 'Less than 10 expected',
        },
      ]);
    });
    it('reports one violation', () => {
      expect(readValue('9.5', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItsMax',
            max: 9,
            inclusive: true,
          },
          message: 'At most 9 expected',
        },
      ]);
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

  describe('ucItsMin', () => {
    let readValue: UcDeserializer.Sync<bigint>;

    beforeAll(async () => {
      readValue = await compile(ucBigInt({ where: ucItsMin(10) }));
    });

    it('rejects lesser number', () => {
      expect(readValue('0n9', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItsMin',
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

  describe('ucItsMin with bigint bound', () => {
    let readValue: UcDeserializer.Sync<bigint>;

    beforeAll(async () => {
      readValue = await compile(ucBigInt({ where: ucItsMin(10n) }));
    });

    it('rejects lesser bigint', () => {
      expect(readValue('0n9', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItsMin',
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

  describe('ucItIsGreaterThan', () => {
    let readValue: UcDeserializer.Sync<bigint>;

    beforeAll(async () => {
      readValue = await compile(ucBigInt({ where: ucItIsGreaterThan(10) }));
    });

    it('rejects lesser number', () => {
      expect(readValue('0n9', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItIsGreaterThan',
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
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItIsGreaterThan',
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

  describe('ucItsMax', () => {
    let readValue: UcDeserializer.Sync<bigint>;

    beforeAll(async () => {
      readValue = await compile(ucBigInt({ where: ucItsMax(10) }));
    });

    it('rejects greater number', () => {
      expect(readValue('0n11', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItsMax',
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

  describe('ucItIsLessThan', () => {
    let readValue: UcDeserializer.Sync<bigint>;

    beforeAll(async () => {
      readValue = await compile(ucBigInt({ where: ucItIsLessThan(10) }));
    });

    it('rejects greater number', () => {
      expect(readValue('0n11', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItIsLessThan',
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
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItIsLessThan',
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
