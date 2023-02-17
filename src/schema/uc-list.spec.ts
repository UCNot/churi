import { beforeEach, describe, expect, it } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { UcdLib } from '../compiler/deserialization/ucd-lib.js';
import { UcsLib } from '../compiler/serialization/ucs-lib.js';
import { UnsupportedUcSchemaError } from '../compiler/unsupported-uc-schema.error.js';
import { UcDeserializer } from '../deserializer/uc-deserializer.js';
import { chunkStream } from '../spec/chunk-stream.js';
import { TextOutStream } from '../spec/text-out-stream.js';
import { UcList, ucList } from './uc-list.js';
import { ucNullable } from './uc-nullable.js';
import { ucOptional } from './uc-optional.js';
import { ucSchemaName } from './uc-schema-name.js';
import { UcSchemaResolver } from './uc-schema-resolver.js';
import { ucSchemaRef } from './uc-schema.js';

describe('UcList', () => {
  const spec = ucList<string>(ucSchemaRef(() => String));

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
      await expect(readList(chunkStream('13'))).rejects.toMatchObject({
        code: 'unexpected',
        details: {
          type: 'number',
          expected: {
            types: ['list'],
          },
        },
        message: 'Unexpected single number, while expected list',
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
  });
});
