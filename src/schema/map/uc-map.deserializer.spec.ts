import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { UnsupportedUcSchemaError } from '../../compiler/common/unsupported-uc-schema.error.js';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { readTokens } from '../../spec/read-chunks.js';
import { UcChargeLexer } from '../../syntax/lexers/uc-charge.lexer.js';
import { ucList } from '../list/uc-list.js';
import { ucMultiValue } from '../list/uc-multi-value.js';
import { ucNumber } from '../numeric/uc-number.js';
import { ucString } from '../string/uc-string.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcError, UcErrorInfo } from '../uc-error.js';
import { ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { UcDataType, UcModel } from '../uc-schema.js';
import { UcMap, ucMap } from './uc-map.js';

describe('UcMap deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: UcErrorInfo[];

  beforeEach(() => {
    errors = [];
  });

  describe('empty map', () => {
    let readMap: UcDeserializer<UcMap>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readMap: ucMap({}),
        },
      });

      ({ readMap } = await compiler.evaluate());
    });

    it('deserializes empty map', () => {
      expect(readMap('$')).toEqual({});
    });
    it('rejects null', () => {
      expect(readMap('--', { onError })).toBeUndefined();
      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'null',
            expected: {
              types: ['map'],
            },
          },
          message: 'Unexpected null instead of map',
        },
      ]);
    });
    it('rejects entry', () => {
      expect(readMap('foo()', { onError })).toEqual({});
      expect(errors).toEqual([
        {
          code: 'unexpectedEntry',
          path: [{}, { key: 'foo' }],
          details: {
            key: 'foo',
          },
          message: 'Unexpected entry: foo',
        },
      ]);
    });
  });

  describe('single entry', () => {
    let readMap: UcDeserializer<{ foo: string }>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readMap: ucMap<{ foo: UcModel<string> }>({
            foo: String,
          }),
        },
      });

      ({ readMap } = await compiler.evaluate());
    });

    it('deserializes entry', async () => {
      await expect(readMap(readTokens('foo(bar)'))).resolves.toEqual({ foo: 'bar' });
      await expect(readMap(readTokens('foo(bar'))).resolves.toEqual({ foo: 'bar' });
    });
    it('deserializes entry synchronously', () => {
      expect(readMap(UcChargeLexer.scan('foo(bar)'))).toEqual({ foo: 'bar' });
      expect(readMap(UcChargeLexer.scan('foo(bar'))).toEqual({ foo: 'bar' });
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
        path: [{}],
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
      await expect(readMap(readTokens('foo(),'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{ index: 1 }],
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
      await expect(readMap(readTokens('$foo(),'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{ index: 1 }],
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
      const compiler = new UcdCompiler({
        models: {
          readMap: ucMap({
            test: { type: 'test-type' },
          }),
        },
      });

      let error: UnsupportedUcSchemaError | undefined;

      try {
        await compiler.generate();
      } catch (e) {
        error = e as UnsupportedUcSchemaError;
      }

      expect(error).toBeInstanceOf(UnsupportedUcSchemaError);
      expect(error?.schema.type).toBe('test-type');
      expect(error?.message).toBe('Map: Can not deserialize entry "test" of type "test-type"');
      expect(error?.cause).toBeInstanceOf(UnsupportedUcSchemaError);
      expect((error?.cause as UnsupportedUcSchemaError).schema.type).toBe('test-type');
    });
  });

  describe('multiple entries', () => {
    let readMap: UcDeserializer<{ foo: string; bar: string }>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readMap: ucMap<{ foo: UcModel<string>; bar: UcModel<string> }>({
            foo: String,
            bar: String,
          }),
        },
      });

      ({ readMap } = await compiler.evaluate());
    });

    it('deserializes entries', async () => {
      await expect(readMap(readTokens('foo(first)bar(second'))).resolves.toEqual({
        foo: 'first',
        bar: 'second',
      });
    });
    it('deserializes entries synchronously', () => {
      expect(readMap(UcChargeLexer.scan('foo(first)bar(second'))).toEqual({
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
          path: [{}],
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
          path: [{}, { key: 'wrong' }],
          details: {
            key: 'wrong',
          },
          message: 'Unexpected entry: wrong',
        },
      ]);
    });
    it('rejects nested list', async () => {
      await expect(
        readMap(readTokens('foo(first) bar(second) () '), { onError }),
      ).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{ index: 1 }],
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
      await expect(
        readMap(readTokens('foo(first) bar(second) , '), { onError }),
      ).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{ index: 1 }],
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
    it('overwrites entry value', async () => {
      await expect(
        readMap(readTokens('foo(first)bar(second)foo(third)'), { onError }),
      ).resolves.toEqual({
        foo: 'third',
        bar: 'second',
      });

      expect(errors).toEqual([]);
    });
  });

  describe('with duplicates: reject', () => {
    let readMap: UcDeserializer<{ foo: string; bar: string }>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readMap: ucMap<{ foo: UcModel<string>; bar: UcModel<string> }>(
            {
              foo: String,
              bar: String,
            },
            {
              duplicates: 'reject',
            },
          ),
        },
      });

      ({ readMap } = await compiler.evaluate());
    });

    it('rejects entry duplicate', async () => {
      await expect(
        readMap(readTokens('foo(first)bar(second)foo(third)'), { onError }),
      ).resolves.toEqual({
        foo: 'first',
        bar: 'second',
      });

      expect(errors).toEqual([
        {
          code: 'duplicateEntry',
          path: [{}, { key: 'foo' }],
          details: {
            key: 'foo',
          },
          message: 'Duplicate entry: foo',
        },
      ]);
    });
  });

  describe('with duplicates: collect', () => {
    let readMap: UcDeserializer<{ foo: string | string[]; bar: string | string[] }>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readMap: ucMap(
            {
              foo: ucMultiValue<string>(String),
              bar: ucMultiValue<string>(String),
            },
            {
              duplicates: 'collect',
            },
          ),
        },
      });

      ({ readMap } = await compiler.evaluate());
    });

    it('collects entry duplicates', async () => {
      await expect(
        readMap(readTokens('foo(first)bar(second)foo(third)'), { onError }),
      ).resolves.toEqual({
        foo: ['first', 'third'],
        bar: 'second',
      });

      expect(errors).toEqual([]);
    });
  });

  describe('with duplicates: collect and without required members', () => {
    let readMap: UcDeserializer<{
      foo?: string | string[] | undefined;
      bar?: string | string[] | undefined;
    }>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readMap: ucMap(
            {
              foo: ucOptional(ucMultiValue<string>(String)),
              bar: ucOptional(ucMultiValue<string>(String)),
            },
            {
              duplicates: 'collect',
            },
          ),
        },
      });

      ({ readMap } = await compiler.evaluate());
    });

    it('collects entry duplicates', async () => {
      await expect(
        readMap(readTokens('foo(first)foo(second)foo(third)'), { onError }),
      ).resolves.toEqual({
        foo: ['first', 'second', 'third'],
      });

      expect(errors).toEqual([]);
    });
  });

  describe('extra entries', () => {
    let readMap: UcDeserializer<{ length: number } & { [key in Exclude<string, 'foo'>]: string }>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readMap: ucMap(
            {
              length: ucNumber(),
            },
            {
              extra: ucString(),
            },
          ),
        },
      });

      ({ readMap } = await compiler.evaluate());
    });

    it('deserializes extra entries', () => {
      expect(readMap('foo(first)bar(second)length(3)')).toEqual({
        foo: 'first',
        bar: 'second',
        length: 3,
      });
    });
    it('does not deserialize unrecognized extra schema', async () => {
      const compiler = new UcdCompiler({
        models: {
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
        await compiler.evaluate();
      } catch (e) {
        error = e as UnsupportedUcSchemaError;
      }

      expect(error).toBeInstanceOf(UnsupportedUcSchemaError);
      expect(error?.schema.type).toBe('test-type');
      expect(error?.message).toBe('Map: Can not deserialize extra entry of type "test-type"');
      expect(error?.cause).toBeInstanceOf(UnsupportedUcSchemaError);
      expect((error?.cause as UnsupportedUcSchemaError).schema.type).toBe('test-type');
    });
  });

  describe('optional entries', () => {
    let readMap: UcDeserializer<
      { length?: number | undefined } & { [key in Exclude<string, 'foo'>]: string }
    >;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readMap: ucMap(
            {
              length: ucOptional<number>(Number),
            },
            {
              extra: String as UcDataType<string>,
            },
          ),
        },
      });

      ({ readMap } = await compiler.evaluate());
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
    let readMap: UcDeserializer.Sync<{ foo: string[] }>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readMap: [
            'sync',
            ucMap({
              foo: ucList<string>(String),
              bar: ucList<number>(Number),
            }),
          ],
        },
      });

      ({ readMap } = await compiler.evaluate());
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
          path: [{}, { key: 'foo' }],
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
          path: [{}, { key: 'bar' }],
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
          path: [{}, { key: 'foo' }],
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
          path: [{}, { key: 'bar' }],
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
    let readMap: UcDeserializer<{ foo: string } | null>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readMap: ucNullable(
            ucMap<{ foo: UcModel<string> }>({
              foo: String,
            }),
          ),
        },
      });

      ({ readMap } = await compiler.evaluate());
    });

    it('deserializes entry', async () => {
      await expect(readMap(readTokens('foo(bar)'))).resolves.toEqual({ foo: 'bar' });
    });
    it('deserializes null', async () => {
      await expect(readMap(readTokens('--'))).resolves.toBeNull();
    });
  });
});
