import { beforeEach, describe, expect, it } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { UcdLib } from '../compiler/deserialization/ucd-lib.js';
import { UcsLib } from '../compiler/serialization/ucs-lib.js';
import { UnsupportedUcSchemaError } from '../compiler/unsupported-uc-schema.error.js';
import { UcDeserializer } from '../deserializer/uc-deserializer.js';
import { chunkStream } from '../spec/chunk-stream.js';
import { TextOutStream } from '../spec/text-out-stream.js';
import { UcError, UcErrorInfo } from './uc-error.js';
import { UcList, ucList } from './uc-list.js';
import { ucMap } from './uc-map.js';
import { UcNullable, ucNullable } from './uc-nullable.js';
import { ucOptional } from './uc-optional.js';
import { ucSchemaName } from './uc-schema-name.js';
import { UcSchemaResolver } from './uc-schema-resolver.js';
import { UcSchema, ucSchemaRef } from './uc-schema.js';

describe('UcList', () => {
  const spec = ucList<string>(ucSchemaRef<string>(() => String));

  let resolver: UcSchemaResolver;
  let schema: UcList.Schema<string>;

  beforeEach(() => {
    resolver = new UcSchemaResolver();
    schema = resolver.schemaOf(spec);
  });

  describe('item', () => {
    it('contains item schema', () => {
      expect(resolver.schemaOf(spec).item).toEqual({
        optional: false,
        nullable: false,
        type: String,
        asis,
      });
    });
  });

  describe('type', () => {
    it('is set to `list`', () => {
      expect(schema.type).toBe('list');
    });
  });

  describe('name', () => {
    it('reflects item type', () => {
      expect(ucSchemaName(schema)).toBe('String[]');
    });
  });

  describe('serializer', () => {
    it('serializes list', async () => {
      const lib = new UcsLib({
        schemae: {
          writeList: ucList(Number),
        },
      });

      const { writeList } = await lib.compile().toSerializers();

      await expect(TextOutStream.read(async to => await writeList(to, [1, 22, 333]))).resolves.toBe(
        ',1,22,333',
      );
    });
    it('serializes empty list', async () => {
      const lib = new UcsLib({
        schemae: {
          writeList: ucList(Number),
        },
      });

      const { writeList } = await lib.compile().toSerializers();

      await expect(TextOutStream.read(async to => await writeList(to, []))).resolves.toBe(',');
    });
    it('serializes nulls', async () => {
      const lib = new UcsLib({
        schemae: {
          writeList: ucList(ucNullable(Number)),
        },
      });

      const { writeList } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeList(to, [1, null, 333])),
      ).resolves.toBe(',1,--,333');
    });
    it('serializes missing items as nulls', async () => {
      const lib = new UcsLib({
        schemae: {
          writeList: ucList(ucOptional(Number)),
        },
      });

      const { writeList } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeList(to, [1, undefined, 333])),
      ).resolves.toBe(',1,--,333');
    });

    describe('nested list', () => {
      let lib: UcsLib<{ writeList: UcList.Schema<number[]> }>;

      beforeEach(() => {
        lib = new UcsLib({
          schemae: {
            writeList: ucList<number[]>(ucList<number>(Number)),
          },
        });
      });

      it('serialized with one item', async () => {
        const { writeList } = await lib.compile().toSerializers();

        await expect(
          TextOutStream.read(async to => await writeList(to, [[1, 22, 333]])),
        ).resolves.toBe(',(1,22,333)');
      });
      it('serialized with multiple items', async () => {
        const { writeList } = await lib.compile().toSerializers();

        await expect(
          TextOutStream.read(
            async to => await writeList(to, [
                [1, 22, 333],
                [1, 2, 3],
              ]),
          ),
        ).resolves.toBe(',(1,22,333),(1,2,3)');
      });
      it('serialized with empty item', async () => {
        const { writeList } = await lib.compile().toSerializers();

        await expect(TextOutStream.read(async to => await writeList(to, [[]]))).resolves.toBe(
          ',()',
        );
      });
    });

    it('does not serialize unrecognized schema', async () => {
      const lib = new UcsLib({
        schemae: {
          writeList: ucList<number>({ type: 'test-type', asis }),
        },
      });

      let error: UnsupportedUcSchemaError | undefined;

      try {
        await lib.compile().toSerializers();
      } catch (e) {
        error = e as UnsupportedUcSchemaError;
      }

      expect(error).toBeInstanceOf(UnsupportedUcSchemaError);
      expect(error?.schema.type).toBe('test-type');
      expect(error?.message).toBe(
        'writeList$serialize: Can not serialize list item of type "test-type"',
      );
      expect(error?.cause).toBeInstanceOf(UnsupportedUcSchemaError);
      expect((error?.cause as UnsupportedUcSchemaError).schema.type).toBe('test-type');
    });
  });

  describe('deserializer', () => {
    const onError = (error: UcErrorInfo): void => {
      errors.push(error instanceof UcError ? error.toJSON() : error);
    };
    let errors: UcErrorInfo[];

    beforeEach(() => {
      errors = [];
    });

    let readList: UcDeserializer<number[]>;

    beforeEach(async () => {
      const lib = new UcdLib({
        schemae: {
          readList: ucList<number>(Number),
        },
      });

      ({ readList } = await lib.compile().toDeserializers());
    });

    it('deserializes list', async () => {
      await expect(readList(chunkStream('1 , 2, 3  '))).resolves.toEqual([1, 2, 3]);
    });
    it('deserializes empty list', async () => {
      await expect(readList(chunkStream(', '))).resolves.toEqual([]);
    });
    it('deserializes list with leading comma', async () => {
      await expect(readList(chunkStream(' , 1 , 2, 3  '))).resolves.toEqual([1, 2, 3]);
    });
    it('deserializes list with trailing comma', async () => {
      await expect(readList(chunkStream('1, 2, 3,'))).resolves.toEqual([1, 2, 3]);
    });
    it('deserializes single item with leading comma', async () => {
      await expect(readList(chunkStream(' ,13  '))).resolves.toEqual([13]);
    });
    it('deserializes single item with trailing comma', async () => {
      await expect(readList(chunkStream('13 ,  '))).resolves.toEqual([13]);
    });
    it('rejects item instead of list', async () => {
      await expect(readList(chunkStream('13'), { onError })).resolves.toBeUndefined();

      expect(errors).toEqual([
        {
          code: 'unexpectedType',
          details: {
            types: ['number'],
            expected: {
              types: ['list'],
            },
          },
          message: 'Unexpected single number, while list expected',
        },
      ]);
    });
    it('does not deserialize unrecognized schema', async () => {
      const lib = new UcdLib({
        schemae: {
          readList: ucList<number>({ type: 'test-type', asis }),
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
        'readList$deserialize: Can not deserialize list item of type "test-type"',
      );
      expect(error?.cause).toBeInstanceOf(UnsupportedUcSchemaError);
      expect((error?.cause as UnsupportedUcSchemaError).schema.type).toBe('test-type');
    });

    describe('of booleans', () => {
      let readList: UcDeserializer<boolean[]>;

      beforeEach(async () => {
        const lib = new UcdLib({
          schemae: {
            readList: ucList<boolean>(Boolean),
          },
        });

        ({ readList } = await lib.compile().toDeserializers());
      });

      it('deserializes items', async () => {
        await expect(readList(chunkStream('-, ! , -  '))).resolves.toEqual([false, true, false]);
      });
    });

    describe('of strings', () => {
      let readList: UcDeserializer<string[]>;

      beforeEach(async () => {
        const lib = new UcdLib({
          schemae: {
            readList: ucList<string>(String),
          },
        });

        ({ readList } = await lib.compile().toDeserializers());
      });

      it('deserializes quoted strings', async () => {
        await expect(readList(chunkStream("'a, 'b , 'c"))).resolves.toEqual(['a', 'b ', 'c']);
      });
    });

    describe('of maps', () => {
      let readList: UcDeserializer<{ foo: string }[]>;

      beforeEach(async () => {
        const lib = new UcdLib({
          schemae: {
            readList: ucList<{ foo: string }>(
              ucMap<{ foo: UcSchema.Spec<string> }>({ foo: String }),
            ),
          },
        });

        ({ readList } = await lib.compile().toDeserializers());
      });

      it('deserializes items', async () => {
        await expect(readList(chunkStream('$foo, foo(bar) , $foo(baz)'))).resolves.toEqual([
          { foo: '' },
          { foo: 'bar' },
          { foo: 'baz' },
        ]);
        await expect(readList(chunkStream('$foo(), foo(bar) , foo(baz),'))).resolves.toEqual([
          { foo: '' },
          { foo: 'bar' },
          { foo: 'baz' },
        ]);
        await expect(readList(chunkStream('foo(), foo(bar) , foo(baz)'))).resolves.toEqual([
          { foo: '' },
          { foo: 'bar' },
          { foo: 'baz' },
        ]);
        await expect(readList(chunkStream(',foo(), foo(bar) , foo(baz))'))).resolves.toEqual([
          { foo: '' },
          { foo: 'bar' },
          { foo: 'baz' },
        ]);
        await expect(readList(chunkStream(',$foo(), foo(bar) , foo(baz))'))).resolves.toEqual([
          { foo: '' },
          { foo: 'bar' },
          { foo: 'baz' },
        ]);
      });
      it('rejects nested list', async () => {
        await expect(
          readList(chunkStream('foo() () foo(bar) , $foo(baz)'), { onError }),
        ).resolves.toEqual([{ foo: '' }, { foo: 'bar' }, { foo: 'baz' }]);

        expect(errors).toEqual([
          {
            code: 'unexpectedType',
            details: {
              type: 'nested list',
              expected: {
                types: ['map'],
              },
            },
            message: 'Unexpected nested list, while map expected',
          },
        ]);
      });
      it('rejects nested list after $-prefixed map', async () => {
        await expect(
          readList(chunkStream('$foo() () foo(bar) , $foo(baz)'), { onError }),
        ).resolves.toEqual([{ foo: '' }, { foo: 'bar' }, { foo: 'baz' }]);

        expect(errors).toEqual([
          {
            code: 'unexpectedType',
            details: {
              type: 'nested list',
              expected: {
                types: ['map'],
              },
            },
            message: 'Unexpected nested list, while map expected',
          },
        ]);
      });
    });

    describe('with nullable items', () => {
      let readList: UcDeserializer<(number | null)[]>;

      beforeEach(async () => {
        const nullableNumber = ucNullable<number>(Number);
        const lib = new UcdLib({
          schemae: {
            readList: ucList<number | null>(nullableNumber),
          },
        });

        ({ readList } = await lib.compile().toDeserializers());
      });

      it('deserializes null item', async () => {
        await expect(readList(chunkStream('--,'))).resolves.toEqual([null]);
        await expect(readList(chunkStream(',--'))).resolves.toEqual([null]);
        await expect(readList(chunkStream('--,1'))).resolves.toEqual([null, 1]);
        await expect(readList(chunkStream('1, --'))).resolves.toEqual([1, null]);
      });
      it('rejects null', async () => {
        const error = await readList(chunkStream('--')).catch(asis);

        expect((error as UcError).toJSON()).toEqual({
          code: 'unexpectedType',
          details: {
            types: ['number', 'null'],
            expected: {
              types: ['list'],
            },
          },
          message: 'Unexpected single number or null, while list expected',
        });
      });
    });

    describe('nullable', () => {
      let readList: UcDeserializer<number[] | null>;

      beforeEach(async () => {
        const lib = new UcdLib<{ readList: UcNullable.Spec<number[]> }>({
          schemae: {
            readList: ucNullable(ucList<number>(Number)),
          },
        });

        ({ readList } = await lib.compile().toDeserializers());
      });

      it('deserializes null', async () => {
        await expect(readList(chunkStream('--'))).resolves.toBeNull();
      });
      it('rejects null items', async () => {
        const error = {
          code: 'unexpectedType',
          details: {
            type: 'null',
            expected: {
              types: ['number'],
            },
          },
          message: 'Unexpected null, while number expected',
        };

        await expect(
          readList(chunkStream('--,'))
            .catch(asis)
            .then(error => (error as UcError).toJSON()),
        ).resolves.toEqual(error);
        await expect(
          readList(chunkStream(',--'))
            .catch(asis)
            .then(error => (error as UcError).toJSON()),
        ).resolves.toEqual(error);
      });
      it('deserializes list', async () => {
        await expect(readList(chunkStream('1, 2'))).resolves.toEqual([1, 2]);
      });
    });

    describe('nullable with nullable items', () => {
      let readList: UcDeserializer<(number | null)[] | null>;

      beforeEach(async () => {
        const nullableNumber = ucNullable<number>(Number);
        const lib = new UcdLib<{ readList: UcNullable.Spec<(number | null)[]> }>({
          schemae: {
            readList: ucNullable(ucList<number | null>(nullableNumber)),
          },
        });

        ({ readList } = await lib.compile().toDeserializers());
      });

      it('deserializes null', async () => {
        await expect(readList(chunkStream('--'))).resolves.toBeNull();
      });
      it('deserializes list', async () => {
        await expect(readList(chunkStream('1, 2'))).resolves.toEqual([1, 2]);
      });
      it('deserializes null item', async () => {
        await expect(readList(chunkStream('--,'))).resolves.toEqual([null]);
        await expect(readList(chunkStream(',--'))).resolves.toEqual([null]);
        await expect(readList(chunkStream('--,1'))).resolves.toEqual([null, 1]);
        await expect(readList(chunkStream('1, --'))).resolves.toEqual([1, null]);
      });
    });

    describe('nested', () => {
      let readMatrix: UcDeserializer<number[][]>;

      beforeEach(async () => {
        const lib = new UcdLib({
          schemae: {
            readMatrix: ucList<number[]>(ucList<number>(Number)),
          },
        });

        ({ readMatrix } = await lib.compile().toDeserializers());
      });

      it('deserializes nested list', async () => {
        await expect(readMatrix(chunkStream(' ( 13 ) '))).resolves.toEqual([[13]]);
      });
      it('deserializes comma-separated lists', async () => {
        await expect(readMatrix(chunkStream(' (13, 14), (15, 16) '))).resolves.toEqual([
          [13, 14],
          [15, 16],
        ]);
      });
      it('deserializes lists', async () => {
        await expect(readMatrix(chunkStream(' (13, 14) (15, 16) '))).resolves.toEqual([
          [13, 14],
          [15, 16],
        ]);
      });
      it('deserializes deeply nested lists', async () => {
        const lib = new UcdLib({
          schemae: {
            readCube: ucList<number[][]>(ucList<number[]>(ucList<number>(Number))),
          },
        });

        const { readCube } = await lib.compile().toDeserializers();

        await expect(readCube(chunkStream('((13, 14))'))).resolves.toEqual([[[13, 14]]]);
      });
    });

    describe('nested or null', () => {
      let readMatrix: UcDeserializer<(number[] | null)[]>;

      beforeEach(async () => {
        const list = ucList<number>(Number);
        const lib = new UcdLib({
          schemae: {
            readMatrix: ucList<number[] | null>(ucNullable(list)),
          },
        });

        ({ readMatrix } = await lib.compile().toDeserializers());
      });

      it('deserializes nested list', async () => {
        await expect(readMatrix(chunkStream(' ( 13 ) '))).resolves.toEqual([[13]]);
      });
      it('deserializes null items', async () => {
        await expect(readMatrix(chunkStream('--,'))).resolves.toEqual([null]);
        await expect(readMatrix(chunkStream(', --'))).resolves.toEqual([null]);
        await expect(readMatrix(chunkStream('(13)--'))).resolves.toEqual([[13], null]);
      });
      it('rejects null', async () => {
        const error = await readMatrix(chunkStream('--')).catch(error => (error as UcError)?.toJSON?.());

        expect(error).toEqual({
          code: 'unexpectedType',
          details: {
            type: 'null',
            expected: {
              types: ['nested list'],
            },
          },
          message: 'Unexpected null, while nested list expected',
        });
      });
    });

    describe('nullable with nested', () => {
      let readMatrix: UcDeserializer<number[][] | null>;

      beforeEach(async () => {
        const matrix = ucList<number[]>(ucList<number>(Number));
        const lib = new UcdLib({
          schemae: {
            readMatrix: ucNullable(matrix),
          },
        });

        ({ readMatrix } = await lib.compile().toDeserializers());
      });

      it('deserializes null', async () => {
        await expect(readMatrix(chunkStream('--'))).resolves.toBeNull();
      });
      it('rejects null items', async () => {
        const error = {
          code: 'unexpectedType',
          details: {
            type: 'null',
            expected: {
              types: ['nested list'],
            },
          },
          message: 'Unexpected null, while nested list expected',
        };

        await expect(
          readMatrix(chunkStream('--,')).catch(error => (error as UcError)?.toJSON?.()),
        ).resolves.toEqual(error);
        await expect(
          readMatrix(chunkStream(',--')).catch(error => (error as UcError)?.toJSON?.()),
        ).resolves.toEqual(error);
      });
    });
  });
});
