import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdLib } from '../../compiler/deserialization/ucd-lib.js';
import { UnsupportedUcSchemaError } from '../../compiler/unsupported-uc-schema.error.js';
import { parseTokens, readTokens } from '../../spec/read-chunks.js';
import { UcList, ucList } from '../list/uc-list.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcError, UcErrorInfo } from '../uc-error.js';
import { UcNullable, ucNullable } from '../uc-nullable.js';
import { UcOptional, ucOptional } from '../uc-optional.js';
import { UcSchema } from '../uc-schema.js';
import { UcMap, ucMap } from './uc-map.js';

describe('UcMap deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: UcErrorInfo[];

  beforeEach(() => {
    errors = [];
  });

  describe('single entry', () => {
    let lib: UcdLib<{ readMap: UcMap.Schema<{ foo: UcSchema.Spec<string> }> }>;
    let readMap: UcDeserializer<{ foo: string }>;

    beforeEach(async () => {
      lib = new UcdLib({
        schemae: {
          readMap: ucMap<{ foo: UcSchema.Spec<string> }>({
            foo: String,
          }),
        },
      });
      ({ readMap } = await lib.compile().toDeserializers());
    });

    it('deserializes entry', async () => {
      await expect(readMap(readTokens('foo(bar)'))).resolves.toEqual({ foo: 'bar' });
      await expect(readMap(readTokens('foo(bar'))).resolves.toEqual({ foo: 'bar' });
    });
    it('deserializes entry synchronously', () => {
      expect(readMap(parseTokens('foo(bar)'))).toEqual({ foo: 'bar' });
      expect(readMap(parseTokens('foo(bar'))).toEqual({ foo: 'bar' });
    });
    it('deserializes $-escaped entry', async () => {
      await expect(readMap(readTokens('$foo(bar)'))).resolves.toEqual({ foo: 'bar' });
    });
    it('deserializes $-escaped suffix', async () => {
      await expect(readMap(readTokens('$foo'))).resolves.toEqual({ foo: '' });
      await expect(readMap(readTokens('$foo \r\n   '))).resolves.toEqual({ foo: '' });
      await expect(readMap(readTokens('\r\n $foo'))).resolves.toEqual({ foo: '' });
    });
    it('handles whitespace', async () => {
      await expect(readMap(readTokens(' \n foo \r  \n  (\n  bar  \n)\n'))).resolves.toEqual({
        foo: 'bar',
      });
    });
    it('overrides repeating entry value', async () => {
      const errors: unknown[] = [];

      await expect(
        readMap(readTokens('foo(bar)foo'), { onError: error => errors.push(error) }),
      ).resolves.toEqual({ foo: '' });
    });
    it('rejects null', async () => {
      await expect(
        readMap(readTokens('--')).catch(error => (error as UcError)?.toJSON?.()),
      ).resolves.toEqual({
        code: 'unexpectedType',
        details: {
          type: 'null',
          expected: {
            types: ['map'],
          },
        },
        message: 'Unexpected null instead of map',
      });
    });
    it('rejects second item', async () => {
      await expect(readMap(readTokens('foo(),'), { onError })).resolves.toEqual({ foo: '' });

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: {
            type: 'list',
            expected: {
              types: ['map'],
            },
          },
          message: 'Unexpected list instead of map',
        },
      ]);
    });
    it('rejects second item after $-prefixes map', async () => {
      await expect(readMap(readTokens('$foo(),'), { onError })).resolves.toEqual({ foo: '' });

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: {
            type: 'list',
            expected: {
              types: ['map'],
            },
          },
          message: 'Unexpected list instead of map',
        },
      ]);
    });
    it('does not deserialize unrecognized entity schema', async () => {
      const lib = new UcdLib({
        schemae: {
          readMap: ucMap({
            test: { type: 'test-type' },
          }),
        },
      });

      let error: UnsupportedUcSchemaError | undefined;

      try {
        await lib.compile().toDeserializers();
      } catch (e) {
        error = e as UnsupportedUcSchemaError;
      }

      expect(error).toBeInstanceOf(UnsupportedUcSchemaError);
      expect(error?.schema.type).toBe('test-type');
      expect(error?.message).toBe(
        '{test: test-type}: Can not deserialize entry "test" of type "test-type"',
      );
      expect(error?.cause).toBeInstanceOf(UnsupportedUcSchemaError);
      expect((error?.cause as UnsupportedUcSchemaError).schema.type).toBe('test-type');
    });
  });

  describe('multiple entries', () => {
    let lib: UcdLib<{
      readMap: UcMap.Schema<{ foo: UcSchema.Spec<string>; bar: UcSchema.Spec<string> }>;
    }>;
    let readMap: UcDeserializer<{ foo: string; bar: string }>;

    beforeEach(async () => {
      lib = new UcdLib({
        schemae: {
          readMap: ucMap<{ foo: UcSchema.Spec<string>; bar: UcSchema.Spec<string> }>({
            foo: String,
            bar: String,
          }),
        },
      });
      ({ readMap } = await lib.compile().toDeserializers());
    });

    it('deserializes entries', async () => {
      await expect(readMap(readTokens('foo(first)bar(second'))).resolves.toEqual({
        foo: 'first',
        bar: 'second',
      });
    });
    it('deserializes entries synchronously', () => {
      expect(readMap(parseTokens('foo(first)bar(second'))).toEqual({
        foo: 'first',
        bar: 'second',
      });
    });
    it('deserializes $-escaped entries', async () => {
      await expect(readMap(readTokens('foo(first)$bar(second'))).resolves.toEqual({
        foo: 'first',
        bar: 'second',
      });
    });
    it('deserializes suffix', async () => {
      await expect(readMap(readTokens('foo(first) \n  bar \r\n '))).resolves.toEqual({
        foo: 'first',
        bar: '',
      });
      await expect(readMap(readTokens('foo(first) \n  bar )'))).resolves.toEqual({
        foo: 'first',
        bar: '',
      });
    });
    it('handles whitespace', async () => {
      await expect(
        readMap(readTokens('foo(first\r  \n) \n $bar \r \n ( \r second \n )')),
      ).resolves.toEqual({
        foo: 'first',
        bar: 'second',
      });
    });
    it('rejects incomplete map', async () => {
      const errors: UcErrorInfo[] = [];

      await expect(
        readMap(readTokens('foo(first)'), { onError: error => errors.push(error) }),
      ).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'missingEntries',
          details: {
            keys: ['bar'],
          },
          message: `Map entries missing: "bar"`,
        },
      ]);
    });
    it('rejects unknown entry', async () => {
      await expect(
        readMap(readTokens('foo(first)wrong(123)bar(second'), { onError }),
      ).resolves.toEqual({
        foo: 'first',
        bar: 'second',
      });

      expect(errors).toEqual([
        {
          code: 'unexpectedEntry',
          details: {
            key: 'wrong',
          },
          message: 'Unexpected entry: wrong',
        },
      ]);
    });
    it('rejects nested list', async () => {
      await expect(readMap(readTokens('foo(first) bar(second) () '), { onError })).resolves.toEqual(
        { foo: 'first', bar: 'second' },
      );

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: {
            type: 'nested list',
            expected: {
              types: ['map'],
            },
          },
          message: 'Unexpected nested list instead of map',
        },
      ]);
    });
    it('rejects second item', async () => {
      await expect(readMap(readTokens('foo(first) bar(second) , '), { onError })).resolves.toEqual({
        foo: 'first',
        bar: 'second',
      });

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: {
            type: 'list',
            expected: {
              types: ['map'],
            },
          },
          message: 'Unexpected list instead of map',
        },
      ]);
    });
  });

  describe('extra entries', () => {
    let lib: UcdLib<{
      readMap: UcMap.Schema<{ length: UcSchema.Spec<number> }, UcSchema.Spec<string>>;
    }>;
    let readMap: UcDeserializer<{ length: number } & { [key in Exclude<string, 'foo'>]: string }>;

    beforeEach(async () => {
      lib = new UcdLib({
        schemae: {
          readMap: ucMap(
            {
              length: Number as UcSchema.Class<number>,
            },
            {
              extra: String as UcSchema.Class<string>,
            },
          ),
        },
      });
      ({ readMap } = await lib.compile().toDeserializers());
    });

    it('deserializes extra entries', () => {
      expect(readMap('foo(first)bar(second)length(3)')).toEqual({
        foo: 'first',
        bar: 'second',
        length: 3,
      });
    });
    it('does not deserialize unrecognized extra schema', async () => {
      const lib = new UcdLib({
        schemae: {
          readMap: ucMap(
            {
              test: String,
            },
            {
              extra: { type: 'test-type' },
            },
          ),
        },
      });

      let error: UnsupportedUcSchemaError | undefined;

      try {
        await lib.compile().toDeserializers();
      } catch (e) {
        error = e as UnsupportedUcSchemaError;
      }

      expect(error).toBeInstanceOf(UnsupportedUcSchemaError);
      expect(error?.schema.type).toBe('test-type');
      expect(error?.message).toBe(
        '{test: String}: Can not deserialize extra entry of type "test-type"',
      );
      expect(error?.cause).toBeInstanceOf(UnsupportedUcSchemaError);
      expect((error?.cause as UnsupportedUcSchemaError).schema.type).toBe('test-type');
    });
  });

  describe('optional entries', () => {
    let lib: UcdLib<{
      readMap: UcMap.Schema<{ length: UcOptional.Spec<number> }, UcSchema.Spec<string>>;
    }>;
    let readMap: UcDeserializer<{ length?: number | undefined } & { [key in Exclude<string, 'foo'>]: string }>;

    beforeEach(async () => {
      lib = new UcdLib({
        schemae: {
          readMap: ucMap(
            {
              length: ucOptional<number>(Number),
            },
            {
              extra: String as UcSchema.Class<string>,
            },
          ),
        },
      });
      ({ readMap } = await lib.compile().toDeserializers());
    });

    it('deserializes extra entries', () => {
      expect(readMap('foo(first)bar(second)')).toEqual({
        foo: 'first',
        bar: 'second',
      });
    });
    it('deserializes optional entry', () => {
      expect(readMap('length(0)')).toEqual({
        length: 0,
      });
    });
    it('deserializes empty map', () => {
      expect(readMap('$')).toEqual({});
      expect(readMap(' $ ')).toEqual({});
    });
  });

  describe('list entry', () => {
    let lib: UcdLib<{
      readMap: UcMap.Schema<{ foo: UcList.Schema.Spec<string>; bar: UcList.Schema.Spec<number> }>;
    }>;
    let readMap: UcDeserializer.Sync<{ foo: string[] }>;

    beforeEach(async () => {
      lib = new UcdLib({
        schemae: {
          readMap: ucMap({
            foo: ucList<string>(String),
            bar: ucList<number>(Number),
          }),
        },
      });
      ({ readMap } = await lib.compile('sync').toDeserializers());
    });

    it('deserializes comma-separated items', () => {
      expect(readMap('foo(,bar,baz)bar(1, 2)')).toEqual({ foo: ['bar', 'baz'], bar: [1, 2] });
    });
    it('rejects single value', () => {
      const errors: unknown[] = [];

      expect(
        readMap('foo(bar)bar(1) foo(baz)bar(2)', { onError: error => errors.push(error) }),
      ).toEqual({});
      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: {
            expected: {
              types: ['list'],
            },
            types: ['string'],
          },
          message: 'Unexpected single string instead of list',
        },
        {
          code: 'unexpectedType',
          details: {
            expected: {
              types: ['list'],
            },
            types: ['number'],
          },
          message: 'Unexpected single number instead of list',
        },
        {
          code: 'unexpectedType',
          details: {
            expected: {
              types: ['list'],
            },
            types: ['string'],
          },
          message: 'Unexpected single string instead of list',
        },
        {
          code: 'unexpectedType',
          details: {
            expected: {
              types: ['list'],
            },
            types: ['number'],
          },
          message: 'Unexpected single number instead of list',
        },
      ]);
    });
  });

  describe('nullable', () => {
    let lib: UcdLib<{ readMap: UcNullable.Spec<{ foo: string }> }>;
    let readMap: UcDeserializer<{ foo: string } | null>;

    beforeEach(async () => {
      lib = new UcdLib({
        schemae: {
          readMap: ucNullable(
            ucMap<{ foo: UcSchema.Spec<string> }>({
              foo: String,
            }),
          ),
        },
      });
      ({ readMap } = await lib.compile().toDeserializers());
    });

    it('deserializes entry', async () => {
      await expect(readMap(readTokens('foo(bar)'))).resolves.toEqual({ foo: 'bar' });
    });
    it('deserializes null', async () => {
      await expect(readMap(readTokens('--'))).resolves.toBeNull();
    });
  });
});
