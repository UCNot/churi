import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { UcSchema } from '../uc-schema.js';
import { ucItHasMaxChars, ucItHasMinChars } from './uc-string-length.validator.js';
import { ucString } from './uc-string.js';

describe('string length validator', () => {
  let errors: UcErrorInfo[];
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };

  beforeEach(() => {
    errors = [];
  });

  describe('ucItHasMinChars', () => {
    let readValue: UcDeserializer.Sync<string>;

    beforeAll(async () => {
      readValue = await compile(ucString({ where: ucItHasMinChars(3) }));
    });

    it('rejects shorter string', () => {
      expect(readValue('ab', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItHasMinChars',
            minChars: 3,
          },
          message: 'At least 3 characters expected',
        },
      ]);
    });
    it('accepts longer or equal length', () => {
      expect(readValue('abc', { onError })).toBe('abc');
      expect(readValue('abcd', { onError })).toBe('abcd');
      expect(errors).toEqual([]);
    });
    it('supports custom message', async () => {
      const readValue = await compile(ucString({ where: ucItHasMinChars(3, 'Wrong!') }));

      expect(readValue('', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItHasMinChars',
            minChars: 3,
          },
          message: 'Wrong!',
        },
      ]);
    });
  });

  describe('ucItHasMaxChars', () => {
    let readValue: UcDeserializer.Sync<string>;

    beforeAll(async () => {
      readValue = await compile(ucString({ where: ucItHasMaxChars(3) }));
    });

    it('rejects longer string', () => {
      expect(readValue('abcd', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItHasMaxChars',
            maxChars: 3,
          },
          message: 'At most 3 characters expected',
        },
      ]);
    });
    it('accepts shorter or equal length', () => {
      expect(readValue('abc', { onError })).toBe('abc');
      expect(readValue('ab', { onError })).toBe('ab');
      expect(errors).toEqual([]);
    });
    it('supports custom message', async () => {
      const readValue = await compile(ucString({ where: ucItHasMaxChars(3, 'Wrong!') }));

      expect(readValue('abcd', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'violation',
          path: [{}],
          details: {
            constraint: 'ItHasMaxChars',
            maxChars: 3,
          },
          message: 'Wrong!',
        },
      ]);
    });
  });

  async function compile(schema: UcSchema<string>): Promise<UcDeserializer.Sync<string>> {
    const compiler = new UcdCompiler({ models: { readValue: schema }, mode: 'sync' });
    const { readValue } = await compiler.evaluate();

    return readValue;
  }
});
