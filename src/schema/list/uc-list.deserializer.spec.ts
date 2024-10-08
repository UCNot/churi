import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { UnsupportedUcSchemaError } from '../../compiler/common/unsupported-uc-schema.error.js';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { parseTokens } from '../../spec/read-chunks.js';
import { UcChargeLexer } from '../../syntax/formats/charge/uc-charge.lexer.js';
import { ucMap } from '../map/uc-map.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcError, UcErrorInfo } from '../uc-error.js';
import { ucNullable } from '../uc-nullable.js';
import { UcModel } from '../uc-schema.js';
import { ucList } from './uc-list.js';

describe('UcList deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: UcErrorInfo[];

  beforeEach(() => {
    errors = [];
  });

  describe('with single: reject', () => {
    let readList: UcDeserializer.ByTokens<number[]>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readList: {
            model: ucList<number>(Number),
            byTokens: true,
          },
        },
      });

      ({ readList } = await compiler.evaluate());
    });

    it('deserializes list', async () => {
      await expect(readList(parseTokens('1 , 2, 3  '))).resolves.toEqual([1, 2, 3]);
    });
    it('deserializes list synchronously', () => {
      expect(readList(UcChargeLexer.scan('1 , 2, 3  '))).toEqual([1, 2, 3]);
    });
    it('deserializes empty list', async () => {
      await expect(readList(parseTokens(', '))).resolves.toEqual([]);
    });
    it('deserializes list with leading comma', async () => {
      await expect(readList(parseTokens(' , 1 , 2, 3  '))).resolves.toEqual([1, 2, 3]);
    });
    it('deserializes list with trailing comma', async () => {
      await expect(readList(parseTokens('1, 2, 3,'))).resolves.toEqual([1, 2, 3]);
    });
    it('deserializes single item with leading comma', async () => {
      await expect(readList(parseTokens(' ,13  '))).resolves.toEqual([13]);
    });
    it('deserializes single item with trailing comma', async () => {
      await expect(readList(parseTokens('13 ,  '))).resolves.toEqual([13]);
    });
    it('rejects item instead of list', async () => {
      await expect(readList(parseTokens('13'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            types: ['number'],
            expected: {
              types: ['list'],
            },
          },
          message: 'Unexpected single number instead of list',
        },
      ]);
    });
    it('does not deserialize unrecognized schema', async () => {
      const compiler = new UcdCompiler({
        models: {
          readList: { model: ucList<number>({ type: 'test-type' }) },
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
      expect(error?.message).toBe('List: Can not deserialize list item of type "test-type"');
      expect(error?.cause).toBeInstanceOf(UnsupportedUcSchemaError);
      expect((error?.cause as UnsupportedUcSchemaError).schema.type).toBe('test-type');
    });
  });

  describe('with single: accept', () => {
    let readList: UcDeserializer.ByTokens<number[]>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readList: {
            model: ucList<number>(Number, { single: 'accept' }),
            byTokens: true,
          },
        },
      });

      ({ readList } = await compiler.evaluate());
    });

    it('accepts item instead of list', async () => {
      await expect(readList(parseTokens('13'), { onError })).resolves.toEqual([13]);

      expect(errors).toEqual([]);
    });
  });

  describe('nullable with single: accept', () => {
    let readList: UcDeserializer.ByTokens<number[] | null>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readList: {
            model: ucNullable(ucList<number>(Number, { single: 'accept' })),
            byTokens: true,
          },
        },
      });

      ({ readList } = await compiler.evaluate());
    });

    it('accepts item instead of list', async () => {
      await expect(readList(parseTokens('13'), { onError })).resolves.toEqual([13]);

      expect(errors).toEqual([]);
    });
    it('accepts null', async () => {
      await expect(readList(parseTokens('--'), { onError })).resolves.toBeNull();

      expect(errors).toEqual([]);
    });
  });

  describe('of booleans', () => {
    let readList: UcDeserializer.ByTokens<boolean[]>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readList: {
            model: ucList<boolean>(Boolean),
            byTokens: true,
          },
        },
      });

      ({ readList } = await compiler.evaluate());
    });

    it('deserializes items', async () => {
      await expect(readList(parseTokens('-, ! , -  '))).resolves.toEqual([false, true, false]);
    });
  });

  describe('of strings', () => {
    let readList: UcDeserializer.ByTokens<string[]>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readList: {
            model: ucList<string>(String),
            byTokens: true,
          },
        },
      });

      ({ readList } = await compiler.evaluate());
    });

    it('deserializes quoted strings', async () => {
      await expect(readList(parseTokens("'a, 'b , 'c"))).resolves.toEqual(['a', 'b ', 'c']);
    });
    it('deserializes empty list item', async () => {
      await expect(readList(parseTokens(',,'))).resolves.toEqual(['']);
      await expect(readList(parseTokens(', ,'))).resolves.toEqual(['']);
      await expect(readList(parseTokens(' , ,  '))).resolves.toEqual(['']);
    });
  });

  describe('of maps', () => {
    let readList: UcDeserializer.ByTokens<{ foo: string }[]>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readList: {
            model: ucList<{ foo: string }>(ucMap<{ foo: UcModel<string> }>({ foo: String })),
            byTokens: true,
          },
        },
      });

      ({ readList } = await compiler.evaluate());
    });

    it('deserializes items', async () => {
      await expect(readList(parseTokens('$foo, foo(bar) , $foo(baz)'))).resolves.toEqual([
        { foo: '' },
        { foo: 'bar' },
        { foo: 'baz' },
      ]);
      await expect(readList(parseTokens('$foo(), foo(bar) , foo(baz),'))).resolves.toEqual([
        { foo: '' },
        { foo: 'bar' },
        { foo: 'baz' },
      ]);
      await expect(readList(parseTokens('foo(), foo(bar) , foo(baz)'))).resolves.toEqual([
        { foo: '' },
        { foo: 'bar' },
        { foo: 'baz' },
      ]);
      await expect(readList(parseTokens(',foo(), foo(bar) , foo(baz))'))).resolves.toEqual([
        { foo: '' },
        { foo: 'bar' },
        { foo: 'baz' },
      ]);
      await expect(readList(parseTokens(',$foo(), foo(bar) , foo(baz))'))).resolves.toEqual([
        { foo: '' },
        { foo: 'bar' },
        { foo: 'baz' },
      ]);
    });
    it('rejects nested list', async () => {
      await expect(
        readList(parseTokens('foo() () foo(bar) , $foo(baz)'), { onError }),
      ).resolves.toEqual([{ foo: '' }, { foo: 'bar' }, { foo: 'baz' }]);

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
    it('rejects nested list after $-prefixed map', async () => {
      await expect(
        readList(parseTokens('$foo() () foo(bar) , $foo(baz)'), { onError }),
      ).resolves.toEqual([{ foo: '' }, { foo: 'bar' }, { foo: 'baz' }]);

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
  });

  describe('with nullable items', () => {
    let readList: UcDeserializer.ByTokens<(number | null)[]>;

    beforeAll(async () => {
      const nullableNumber = ucNullable<number>(Number);
      const compiler = new UcdCompiler({
        models: {
          readList: {
            model: ucList<number | null>(nullableNumber),
            byTokens: true,
          },
        },
      });

      ({ readList } = await compiler.evaluate());
    });

    it('deserializes null item', async () => {
      await expect(readList(parseTokens('--,'))).resolves.toEqual([null]);
      await expect(readList(parseTokens(',--'))).resolves.toEqual([null]);
      await expect(readList(parseTokens('--,1'))).resolves.toEqual([null, 1]);
      await expect(readList(parseTokens('1, --'))).resolves.toEqual([1, null]);
    });
    it('rejects null', async () => {
      const error = await readList(parseTokens('--')).catch(asis);

      expect((error as UcError).toJSON()).toEqual({
        code: 'unexpectedType',
        path: [{}],
        details: {
          types: ['number', 'null'],
          expected: {
            types: ['list'],
          },
        },
        message: 'Unexpected single number or null instead of list',
      });
    });
  });

  describe('nullable', () => {
    let readList: UcDeserializer.ByTokens<number[] | null>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readList: {
            model: ucNullable(ucList<number>(Number)),
            byTokens: true,
          },
        },
      });

      ({ readList } = await compiler.evaluate());
    });

    it('deserializes null', async () => {
      await expect(readList(parseTokens('--'))).resolves.toBeNull();
    });
    it('rejects null items', async () => {
      await expect(
        readList(parseTokens('--,'))
          .catch(asis)
          .then(error => (error as UcError).toJSON()),
      ).resolves.toEqual({
        code: 'unexpectedType',
        path: [{ index: 0 }],
        details: {
          type: 'null',
          expected: {
            types: ['number'],
          },
        },
        message: 'Unexpected null instead of number',
      });
      await expect(
        readList(parseTokens(',--'))
          .catch(asis)
          .then(error => (error as UcError).toJSON()),
      ).resolves.toEqual({
        code: 'unexpectedType',
        path: [{ index: 1 }],
        details: {
          type: 'null',
          expected: {
            types: ['number'],
          },
        },
        message: 'Unexpected null instead of number',
      });
    });
    it('deserializes list', async () => {
      await expect(readList(parseTokens('1, 2'))).resolves.toEqual([1, 2]);
    });
  });

  describe('nullable with nullable items', () => {
    let readList: UcDeserializer.ByTokens<(number | null)[] | null>;

    beforeAll(async () => {
      const nullableNumber = ucNullable<number>(Number);
      const compiler = new UcdCompiler({
        models: {
          readList: {
            model: ucNullable(ucList<number | null>(nullableNumber)),
            byTokens: true,
          },
        },
      });

      ({ readList } = await compiler.evaluate());
    });

    it('deserializes null', async () => {
      await expect(readList(parseTokens('--'))).resolves.toBeNull();
    });
    it('deserializes list', async () => {
      await expect(readList(parseTokens('1, 2'))).resolves.toEqual([1, 2]);
    });
    it('deserializes null item', async () => {
      await expect(readList(parseTokens('--,'))).resolves.toEqual([null]);
      await expect(readList(parseTokens(',--'))).resolves.toEqual([null]);
      await expect(readList(parseTokens('--,1'))).resolves.toEqual([null, 1]);
      await expect(readList(parseTokens('1, --'))).resolves.toEqual([1, null]);
    });
  });

  describe('nested', () => {
    let errors: UcErrorInfo[];

    beforeEach(() => {
      errors = [];
    });

    let readMatrix: UcDeserializer.ByTokens<number[][]>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readMatrix: {
            model: ucList<number[]>(ucList<number>(Number)),
            byTokens: true,
          },
        },
      });

      ({ readMatrix } = await compiler.evaluate());
    });

    it('deserializes nested list', async () => {
      await expect(readMatrix(parseTokens(' ( 13 ) '))).resolves.toEqual([[13]]);
    });
    it('rejects missing items', async () => {
      await expect(
        readMatrix(parseTokens(''), { onError: error => errors.push(error) }),
      ).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          path: [{}],
          details: {
            type: 'string',
            expected: {
              types: ['nested list'],
            },
          },
          message: 'Unexpected string instead of nested list',
        },
      ]);
    });
    it('deserializes comma-separated lists', async () => {
      await expect(readMatrix(parseTokens(' (13, 14), (15, 16) '))).resolves.toEqual([
        [13, 14],
        [15, 16],
      ]);
    });
    it('deserializes lists', async () => {
      await expect(readMatrix(parseTokens(' (13, 14) (15, 16) '))).resolves.toEqual([
        [13, 14],
        [15, 16],
      ]);
    });
    it('deserializes deeply nested lists', async () => {
      const compiler = new UcdCompiler({
        models: {
          readCube: {
            model: ucList<number[][]>(ucList<number[]>(ucList<number>(Number))),
            byTokens: true,
          },
        },
      });

      const { readCube } = await compiler.evaluate();

      await expect(readCube(parseTokens('((13, 14))'))).resolves.toEqual([[[13, 14]]]);
    });
    it('recognized empty item of nested list', async () => {
      const compiler = new UcdCompiler({
        models: {
          readMatrix: {
            model: ucList<string[]>(ucList<string>(String)),
            byTokens: true,
          },
        },
      });

      const { readMatrix } = await compiler.evaluate();

      await expect(readMatrix(parseTokens('(,,)'))).resolves.toEqual([['']]);
      await expect(readMatrix(parseTokens('(, ,)'))).resolves.toEqual([['']]);
      await expect(readMatrix(parseTokens('( , ,  )'))).resolves.toEqual([['']]);
    });
  });

  describe('nested or null', () => {
    let readMatrix: UcDeserializer.ByTokens<(number[] | null)[]>;

    beforeAll(async () => {
      const list = ucList<number>(Number);
      const compiler = new UcdCompiler({
        models: {
          readMatrix: {
            model: ucList<number[] | null>(ucNullable(list)),
            byTokens: true,
          },
        },
      });

      ({ readMatrix } = await compiler.evaluate());
    });

    it('deserializes nested list', async () => {
      await expect(readMatrix(parseTokens(' ( 13 ) '))).resolves.toEqual([[13]]);
    });
    it('deserializes null items', async () => {
      await expect(readMatrix(parseTokens('--,'))).resolves.toEqual([null]);
      await expect(readMatrix(parseTokens(', --'))).resolves.toEqual([null]);
      await expect(readMatrix(parseTokens('(13)--'))).resolves.toEqual([[13], null]);
    });
    it('rejects null', async () => {
      const error = await readMatrix(parseTokens('--')).catch(error =>
        (error as UcError)?.toJSON?.(),
      );

      expect(error).toEqual({
        code: 'unexpectedType',
        path: [{}],
        details: {
          type: 'null',
          expected: {
            types: ['nested list'],
          },
        },
        message: 'Unexpected null instead of nested list',
      });
    });
  });

  describe('nullable with nested', () => {
    let readMatrix: UcDeserializer.ByTokens<number[][] | null>;

    beforeAll(async () => {
      const matrix = ucList<number[]>(ucList<number>(Number));
      const compiler = new UcdCompiler({
        models: {
          readMatrix: {
            model: ucNullable(matrix),
            byTokens: true,
          },
        },
      });

      ({ readMatrix } = await compiler.evaluate());
    });

    it('deserializes null', async () => {
      await expect(readMatrix(parseTokens('--'))).resolves.toBeNull();
    });
    it('rejects null items', async () => {
      await expect(
        readMatrix(parseTokens('--,')).catch(error => (error as UcError)?.toJSON?.()),
      ).resolves.toEqual({
        code: 'unexpectedType',
        path: [{ index: 0 }],
        details: {
          type: 'null',
          expected: {
            types: ['nested list'],
          },
        },
        message: 'Unexpected null instead of nested list',
      });
      await expect(
        readMatrix(parseTokens(',--')).catch(error => (error as UcError)?.toJSON?.()),
      ).resolves.toEqual({
        code: 'unexpectedType',
        path: [{ index: 1 }],
        details: {
          type: 'null',
          expected: {
            types: ['nested list'],
          },
        },
        message: 'Unexpected null instead of nested list',
      });
    });
  });

  describe('nullable with nested or null', () => {
    let readMatrix: UcDeserializer.ByTokens<(number[] | null)[] | null>;

    beforeAll(async () => {
      const list = ucList<number>(Number);
      const matrix = ucList<number[] | null>(ucNullable(list));
      const compiler = new UcdCompiler({
        models: {
          readMatrix: {
            model: ucNullable(matrix),
            byTokens: true,
          },
        },
      });

      ({ readMatrix } = await compiler.evaluate());
    });

    it('deserializes null', async () => {
      await expect(readMatrix(parseTokens('--'))).resolves.toBeNull();
    });
    it('deserializes null items', async () => {
      await expect(readMatrix(parseTokens('--,'))).resolves.toEqual([null]);
      await expect(readMatrix(parseTokens(', --'))).resolves.toEqual([null]);
      await expect(readMatrix(parseTokens('(13)--'))).resolves.toEqual([[13], null]);
    });
  });
});
