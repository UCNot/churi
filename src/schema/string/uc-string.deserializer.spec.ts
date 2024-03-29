import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { UcdModels } from '../../compiler/deserialization/ucd-models.js';
import { parseTokens } from '../../spec/read-chunks.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { ucNullable } from '../uc-nullable.js';
import { UcDataType } from '../uc-schema.js';
import { UcString, ucString } from './uc-string.js';

describe('UcString deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: UcErrorInfo[];

  beforeEach(() => {
    errors = [];
  });

  describe('by default', () => {
    let readValue: UcDeserializer.ByTokens<string>;

    beforeAll(async () => {
      const compiler = new UcdCompiler<{ readValue: UcdModels.ByTokensEntry<UcDataType<string>> }>({
        models: {
          readValue: {
            model: String,
            byTokens: true,
          },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('deserializes string', async () => {
      await expect(readValue(parseTokens('some string'))).resolves.toBe('some string');
    });
    it('deserializes multiline string', async () => {
      await expect(readValue(parseTokens('prefix\r', '\n-end(suffix'))).resolves.toBe(
        'prefix\r\n-end(suffix',
      );
      await expect(readValue(parseTokens('prefix\r', '\n!end(suffix'))).resolves.toBe(
        'prefix\r\n!end(suffix',
      );
    });
    it('URI-decodes string', async () => {
      await expect(readValue(parseTokens('some%20string'))).resolves.toBe('some string');
    });
    it('ignores leading and trailing whitespace', async () => {
      await expect(readValue(parseTokens('  \n some string  \n '))).resolves.toBe('some string');
    });
    it('deserializes empty string', async () => {
      await expect(readValue(parseTokens(''))).resolves.toBe('');
      await expect(readValue(parseTokens(')'))).resolves.toBe('');
    });
    it('deserializes number as string', async () => {
      await expect(readValue(parseTokens('123'))).resolves.toBe('123');
      await expect(readValue(parseTokens('-123'))).resolves.toBe('-123');
      await expect(readValue(parseTokens('0x123'))).resolves.toBe('0x123');
    });
    it('deserializes hyphens', async () => {
      await expect(readValue(parseTokens('-'))).resolves.toBe('-');
      await expect(readValue(parseTokens('--'))).resolves.toBe('--');
      await expect(readValue(parseTokens('---'))).resolves.toBe('---');
    });
    it('deserializes minus-prefixed string', async () => {
      await expect(readValue(parseTokens('-a%55c'))).resolves.toBe('-aUc');
      await expect(readValue(parseTokens('%2Da%55c'))).resolves.toBe('-aUc');
    });
    it('deserializes quoted string', async () => {
      await expect(readValue(parseTokens("'abc"))).resolves.toBe('abc');
    });
    it('respects trailing whitespace after quoted string', async () => {
      await expect(readValue(parseTokens("'abc  \n  "))).resolves.toBe('abc  \n  ');
    });
    it('deserializes balanced parentheses within quoted string', async () => {
      await expect(readValue(parseTokens("'abc(def()))"))).resolves.toBe('abc(def())');
    });
    it('does not close unbalanced parentheses within quoted string', async () => {
      await expect(readValue(parseTokens("'abc(def("))).resolves.toBe('abc(def(');
    });
    it('rejects map', async () => {
      await expect(readValue(parseTokens('$foo(bar)'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}, { key: 'foo' }],
          details: {
            type: 'map',
            expected: {
              types: ['string'],
            },
          },
          message: 'Unexpected map instead of string',
        },
      ]);
    });
    it('rejects empty map', async () => {
      await expect(readValue(parseTokens('$'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'map',
            expected: {
              types: ['string'],
            },
          },
          message: 'Unexpected map instead of string',
        },
      ]);
    });
    it('rejects suffix', async () => {
      await expect(readValue(parseTokens('$foo'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}, { key: 'foo' }],
          details: {
            type: 'map',
            expected: {
              types: ['string'],
            },
          },
          message: 'Unexpected map instead of string',
        },
      ]);
    });

    describe('when nullable', () => {
      let readValue: UcDeserializer.ByTokens<string | null>;

      beforeAll(async () => {
        const compiler = new UcdCompiler({
          models: {
            readValue: {
              model: ucNullable<UcString>(String),
              byTokens: true,
            },
          },
        });

        ({ readValue } = await compiler.evaluate());
      });

      it('recognizes null', () => {
        expect(readValue('--')).toBeNull();
      });
    });
  });

  describe('when raw values parsed', () => {
    let readValue: UcDeserializer.ByTokens<string>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readValue: {
            model: ucString({
              raw: 'parse',
            }),
            byTokens: true,
          },
        },
      });

      ({ readValue } = await compiler.evaluate());
    });

    it('rejects positive number', () => {
      expect(readValue('123', { onError })).toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'number',
            expected: {
              types: ['string'],
            },
          },
          message: 'Unexpected number instead of string',
        },
      ]);
    });
    it('rejects negative number', () => {
      expect(readValue('-123', { onError })).toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'number',
            expected: {
              types: ['string'],
            },
          },
          message: 'Unexpected number instead of string',
        },
      ]);
    });
    it('rejects bigint', () => {
      expect(readValue('0n123', { onError })).toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'bigint',
            expected: {
              types: ['string'],
            },
          },
          message: 'Unexpected bigint instead of string',
        },
      ]);
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
              types: ['string'],
            },
          },
          message: 'Unexpected null instead of string',
        },
      ]);
    });
    it('rejects false', () => {
      expect(readValue('-', { onError })).toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'boolean',
            expected: {
              types: ['string'],
            },
          },
          message: 'Unexpected boolean instead of string',
        },
      ]);
    });

    describe('when nullable', () => {
      let readValue: UcDeserializer.ByTokens<string | null>;

      beforeAll(async () => {
        const compiler = new UcdCompiler({
          models: {
            readValue: {
              model: ucNullable(
                ucString({
                  raw: 'parse',
                }),
              ),
              byTokens: true,
            },
          },
        });

        ({ readValue } = await compiler.evaluate());
      });

      it('recognizes null', () => {
        expect(readValue('--')).toBeNull();
      });
    });
  });
});
