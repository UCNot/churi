import { beforeEach, describe, expect, it } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { UcsLib } from '../../compiler/serialization/ucs-lib.js';
import { UnsupportedUcSchemaError } from '../../compiler/unsupported-uc-schema.error.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucMap } from '../map/uc-map.js';
import { ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { UcSchema } from '../uc-schema.js';
import { UcSerializer } from '../uc-serializer.js';
import { UcList, ucList } from './uc-list.js';

describe('UcList serializer', () => {
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

    await expect(TextOutStream.read(async to => await writeList(to, [1, null, 333]))).resolves.toBe(
      ',1,--,333',
    );
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

  describe('of maps', () => {
    let writeList: UcSerializer<{ foo: string }[]>;

    beforeEach(async () => {
      const lib = new UcsLib({
        schemae: {
          writeList: ucList<{ foo: string }>(
            ucMap<{ foo: UcSchema.Spec<string> }>({ foo: String }),
          ),
        },
      });

      ({ writeList } = await lib.compile().toSerializers());
    });

    it('serializes list', async () => {
      await expect(
        TextOutStream.read(async to => await writeList(to, [{ foo: 'bar' }, { foo: 'baz' }])),
      ).resolves.toBe(",foo('bar),foo('baz)");
    });
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

      await expect(TextOutStream.read(async to => await writeList(to, [[]]))).resolves.toBe(',()');
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
