import { beforeEach, describe, expect, it } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { UcdSetup } from '../../compiler/deserialization/ucd-setup.js';
import { UnsupportedUcSchemaError } from '../../compiler/unsupported-uc-schema.error.js';
import { parseTokens, readTokens } from '../../spec/read-chunks.js';
import { ucMap } from '../map/uc-map.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcError, UcErrorInfo } from '../uc-error.js';
import { UcNullable, ucNullable } from '../uc-nullable.js';
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

  let readList: UcDeserializer<number[]>;

  beforeEach(async () => {
    const lib = await new UcdSetup({
      models: {
        readList: ucList<number>(Number),
      },
    }).bootstrap();

    ({ readList } = await lib.compileFactory().toExports());
  });

  it('deserializes list', async () => {
    await expect(readList(readTokens('1 , 2, 3  '))).resolves.toEqual([1, 2, 3]);
  });
  it('deserializes list synchronously', () => {
    expect(readList(parseTokens('1 , 2, 3  '))).toEqual([1, 2, 3]);
  });
  it('deserializes empty list', async () => {
    await expect(readList(readTokens(', '))).resolves.toEqual([]);
  });
  it('deserializes list with leading comma', async () => {
    await expect(readList(readTokens(' , 1 , 2, 3  '))).resolves.toEqual([1, 2, 3]);
  });
  it('deserializes list with trailing comma', async () => {
    await expect(readList(readTokens('1, 2, 3,'))).resolves.toEqual([1, 2, 3]);
  });
  it('deserializes single item with leading comma', async () => {
    await expect(readList(readTokens(' ,13  '))).resolves.toEqual([13]);
  });
  it('deserializes single item with trailing comma', async () => {
    await expect(readList(readTokens('13 ,  '))).resolves.toEqual([13]);
  });
  it('rejects item instead of list', async () => {
    await expect(readList(readTokens('13'), { onError })).resolves.toBeUndefined();

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
    const lib = await new UcdSetup({
      models: {
        readList: ucList<number>({ type: 'test-type' }, { id: 'testList' }),
      },
    }).bootstrap();

    let error: UnsupportedUcSchemaError | undefined;

    try {
      await lib.compileFactory().toExports();
    } catch (e) {
      error = e as UnsupportedUcSchemaError;
    }

    expect(error).toBeInstanceOf(UnsupportedUcSchemaError);
    expect(error?.schema.type).toBe('test-type');
    expect(error?.message).toBe('TestList: Can not deserialize list item of type "test-type"');
    expect(error?.cause).toBeInstanceOf(UnsupportedUcSchemaError);
    expect((error?.cause as UnsupportedUcSchemaError).schema.type).toBe('test-type');
  });

  describe('of booleans', () => {
    let readList: UcDeserializer<boolean[]>;

    beforeEach(async () => {
      const lib = await new UcdSetup({
        models: {
          readList: ucList<boolean>(Boolean),
        },
      }).bootstrap();

      ({ readList } = await lib.compileFactory().toExports());
    });

    it('deserializes items', async () => {
      await expect(readList(readTokens('-, ! , -  '))).resolves.toEqual([false, true, false]);
    });
  });

  describe('of strings', () => {
    let readList: UcDeserializer<string[]>;

    beforeEach(async () => {
      const lib = await new UcdSetup({
        models: {
          readList: ucList<string>(String),
        },
      }).bootstrap();

      ({ readList } = await lib.compileFactory().toExports());
    });

    it('deserializes quoted strings', async () => {
      await expect(readList(readTokens("'a, 'b , 'c"))).resolves.toEqual(['a', 'b ', 'c']);
    });
    it('deserializes empty list item', async () => {
      await expect(readList(readTokens(',,'))).resolves.toEqual(['']);
      await expect(readList(readTokens(', ,'))).resolves.toEqual(['']);
      await expect(readList(readTokens(' , ,  '))).resolves.toEqual(['']);
    });
  });

  describe('of maps', () => {
    let readList: UcDeserializer<{ foo: string }[]>;

    beforeEach(async () => {
      const lib = await new UcdSetup({
        models: {
          readList: ucList<{ foo: string }>(
            ucMap<{ foo: UcModel<string> }>(
              { foo: String },
              {
                id: function NestedMap() {
                  return;
                },
              },
            ),
          ),
        },
      }).bootstrap();

      ({ readList } = await lib.compileFactory().toExports());
    });

    it('deserializes items', async () => {
      await expect(readList(readTokens('$foo, foo(bar) , $foo(baz)'))).resolves.toEqual([
        { foo: '' },
        { foo: 'bar' },
        { foo: 'baz' },
      ]);
      await expect(readList(readTokens('$foo(), foo(bar) , foo(baz),'))).resolves.toEqual([
        { foo: '' },
        { foo: 'bar' },
        { foo: 'baz' },
      ]);
      await expect(readList(readTokens('foo(), foo(bar) , foo(baz)'))).resolves.toEqual([
        { foo: '' },
        { foo: 'bar' },
        { foo: 'baz' },
      ]);
      await expect(readList(readTokens(',foo(), foo(bar) , foo(baz))'))).resolves.toEqual([
        { foo: '' },
        { foo: 'bar' },
        { foo: 'baz' },
      ]);
      await expect(readList(readTokens(',$foo(), foo(bar) , foo(baz))'))).resolves.toEqual([
        { foo: '' },
        { foo: 'bar' },
        { foo: 'baz' },
      ]);
    });
    it('rejects nested list', async () => {
      await expect(
        readList(readTokens('foo() () foo(bar) , $foo(baz)'), { onError }),
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
        readList(readTokens('$foo() () foo(bar) , $foo(baz)'), { onError }),
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
    let readList: UcDeserializer<(number | null)[]>;

    beforeEach(async () => {
      const nullableNumber = ucNullable<number>(Number);
      const lib = await new UcdSetup({
        models: {
          readList: ucList<number | null>(nullableNumber),
        },
      }).bootstrap();

      ({ readList } = await lib.compileFactory().toExports());
    });

    it('deserializes null item', async () => {
      await expect(readList(readTokens('--,'))).resolves.toEqual([null]);
      await expect(readList(readTokens(',--'))).resolves.toEqual([null]);
      await expect(readList(readTokens('--,1'))).resolves.toEqual([null, 1]);
      await expect(readList(readTokens('1, --'))).resolves.toEqual([1, null]);
    });
    it('rejects null', async () => {
      const error = await readList(readTokens('--')).catch(asis);

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
    let readList: UcDeserializer<number[] | null>;

    beforeEach(async () => {
      const lib = await new UcdSetup<{ readList: UcNullable<number[]> }>({
        models: {
          readList: ucNullable(ucList<number>(Number)),
        },
      }).bootstrap();

      ({ readList } = await lib.compileFactory().toExports());
    });

    it('deserializes null', async () => {
      await expect(readList(readTokens('--'))).resolves.toBeNull();
    });
    it('rejects null items', async () => {
      await expect(
        readList(readTokens('--,'))
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
        readList(readTokens(',--'))
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
      await expect(readList(readTokens('1, 2'))).resolves.toEqual([1, 2]);
    });
  });

  describe('nullable with nullable items', () => {
    let readList: UcDeserializer<(number | null)[] | null>;

    beforeEach(async () => {
      const nullableNumber = ucNullable<number>(Number);
      const lib = await new UcdSetup<{ readList: UcNullable<(number | null)[]> }>({
        models: {
          readList: ucNullable(ucList<number | null>(nullableNumber)),
        },
      }).bootstrap();

      ({ readList } = await lib.compileFactory().toExports());
    });

    it('deserializes null', async () => {
      await expect(readList(readTokens('--'))).resolves.toBeNull();
    });
    it('deserializes list', async () => {
      await expect(readList(readTokens('1, 2'))).resolves.toEqual([1, 2]);
    });
    it('deserializes null item', async () => {
      await expect(readList(readTokens('--,'))).resolves.toEqual([null]);
      await expect(readList(readTokens(',--'))).resolves.toEqual([null]);
      await expect(readList(readTokens('--,1'))).resolves.toEqual([null, 1]);
      await expect(readList(readTokens('1, --'))).resolves.toEqual([1, null]);
    });
  });

  describe('nested', () => {
    let readMatrix: UcDeserializer<number[][]>;
    let errors: UcErrorInfo[];

    beforeEach(async () => {
      errors = [];

      const lib = await new UcdSetup({
        models: {
          readMatrix: ucList<number[]>(ucList<number>(Number)),
        },
      }).bootstrap();

      ({ readMatrix } = await lib.compileFactory().toExports());
    });

    it('deserializes nested list', async () => {
      await expect(readMatrix(readTokens(' ( 13 ) '))).resolves.toEqual([[13]]);
    });
    it('rejects missing items', async () => {
      await expect(
        readMatrix(readTokens(''), { onError: error => errors.push(error) }),
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
      await expect(readMatrix(readTokens(' (13, 14), (15, 16) '))).resolves.toEqual([
        [13, 14],
        [15, 16],
      ]);
    });
    it('deserializes lists', async () => {
      await expect(readMatrix(readTokens(' (13, 14) (15, 16) '))).resolves.toEqual([
        [13, 14],
        [15, 16],
      ]);
    });
    it('deserializes deeply nested lists', async () => {
      const lib = await new UcdSetup({
        models: {
          readCube: ucList<number[][]>(ucList<number[]>(ucList<number>(Number))),
        },
      }).bootstrap();

      const { readCube } = await lib.compileFactory().toExports();

      await expect(readCube(readTokens('((13, 14))'))).resolves.toEqual([[[13, 14]]]);
    });
    it('recognized empty item of nested list', async () => {
      const lib = await new UcdSetup({
        models: {
          readMatrix: ucList<string[]>(ucList<string>(String)),
        },
      }).bootstrap();

      const { readMatrix } = await lib.compileFactory().toExports();

      await expect(readMatrix(readTokens('(,,)'))).resolves.toEqual([['']]);
      await expect(readMatrix(readTokens('(, ,)'))).resolves.toEqual([['']]);
      await expect(readMatrix(readTokens('( , ,  )'))).resolves.toEqual([['']]);
    });
  });

  describe('nested or null', () => {
    let readMatrix: UcDeserializer<(number[] | null)[]>;

    beforeEach(async () => {
      const list = ucList<number>(Number);
      const lib = await new UcdSetup({
        models: {
          readMatrix: ucList<number[] | null>(ucNullable(list)),
        },
      }).bootstrap();

      ({ readMatrix } = await lib.compileFactory().toExports());
    });

    it('deserializes nested list', async () => {
      await expect(readMatrix(readTokens(' ( 13 ) '))).resolves.toEqual([[13]]);
    });
    it('deserializes null items', async () => {
      await expect(readMatrix(readTokens('--,'))).resolves.toEqual([null]);
      await expect(readMatrix(readTokens(', --'))).resolves.toEqual([null]);
      await expect(readMatrix(readTokens('(13)--'))).resolves.toEqual([[13], null]);
    });
    it('rejects null', async () => {
      const error = await readMatrix(readTokens('--')).catch(error => (error as UcError)?.toJSON?.());

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
    let readMatrix: UcDeserializer<number[][] | null>;

    beforeEach(async () => {
      const matrix = ucList<number[]>(ucList<number>(Number));
      const lib = await new UcdSetup({
        models: {
          readMatrix: ucNullable(matrix),
        },
      }).bootstrap();

      ({ readMatrix } = await lib.compileFactory().toExports());
    });

    it('deserializes null', async () => {
      await expect(readMatrix(readTokens('--'))).resolves.toBeNull();
    });
    it('rejects null items', async () => {
      await expect(
        readMatrix(readTokens('--,')).catch(error => (error as UcError)?.toJSON?.()),
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
        readMatrix(readTokens(',--')).catch(error => (error as UcError)?.toJSON?.()),
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
    let readMatrix: UcDeserializer<(number[] | null)[] | null>;

    beforeEach(async () => {
      const list = ucList<number>(Number);
      const matrix = ucList<number[] | null>(ucNullable(list));
      const lib = await new UcdSetup({
        models: {
          readMatrix: ucNullable(matrix),
        },
      }).bootstrap();

      ({ readMatrix } = await lib.compileFactory().toExports());
    });

    it('deserializes null', async () => {
      await expect(readMatrix(readTokens('--'))).resolves.toBeNull();
    });
    it('deserializes null items', async () => {
      await expect(readMatrix(readTokens('--,'))).resolves.toEqual([null]);
      await expect(readMatrix(readTokens(', --'))).resolves.toEqual([null]);
      await expect(readMatrix(readTokens('(13)--'))).resolves.toEqual([[13], null]);
    });
  });
});
