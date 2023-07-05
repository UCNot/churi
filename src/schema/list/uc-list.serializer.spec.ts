import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { UnsupportedUcSchemaError } from '../../compiler/unsupported-uc-schema.error.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucMap } from '../map/uc-map.js';
import { UcString, ucString } from '../string/uc-string.js';
import { ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { UcModel } from '../uc-schema.js';
import { UcSerializer } from '../uc-serializer.js';
import { UcList, ucList } from './uc-list.js';

describe('UcList serializer', () => {
  it('serializes list', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeList: ucList(Number),
      },
    });

    const { writeList } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeList(to, [1, 22, 333]))).resolves.toBe(
      ',1,22,333',
    );
  });
  it('serializes empty list', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeList: ucList(Number),
      },
    });

    const { writeList } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeList(to, []))).resolves.toBe(',');
  });
  it('serializes nulls', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeList: ucList(ucNullable(Number)),
      },
    });

    const { writeList } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeList(to, [1, null, 333]))).resolves.toBe(
      ',1,--,333',
    );
  });
  it('serializes missing items as nulls', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeList: ucList(ucOptional(Number)),
      },
    });

    const { writeList } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeList(to, [1, undefined, 333])),
    ).resolves.toBe(',1,--,333');
  });

  describe('of strings', () => {
    let writeList: UcSerializer<string[]>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeList: ucList<UcString>(String),
        },
      });

      ({ writeList } = await compiler.evaluate());
    });

    it('escapes empty items', async () => {
      await expect(TextOutStream.read(async to => await writeList(to, ['', '', '']))).resolves.toBe(
        ",',','",
      );
    });
  });

  describe('of raw strings', () => {
    let writeList: UcSerializer<string[]>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeList: ucList<UcString>(ucString({ raw: 'asString' })),
        },
      });

      ({ writeList } = await compiler.evaluate());
    });

    it('escapes empty items', async () => {
      await expect(TextOutStream.read(async to => await writeList(to, ['', '', '']))).resolves.toBe(
        ",',','",
      );
    });
  });

  describe('of nullable raw strings', () => {
    let writeList: UcSerializer<(string | null)[]>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeList: ucList<UcString | null>(ucNullable(ucString({ raw: 'asString' }))),
        },
      });

      ({ writeList } = await compiler.evaluate());
    });

    it('escapes empty items', async () => {
      await expect(TextOutStream.read(async to => await writeList(to, ['', '', '']))).resolves.toBe(
        ",',','",
      );
    });
  });

  describe('of maps', () => {
    let writeList: UcSerializer<{ foo: string }[]>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeList: ucList<{ foo: string }>(ucMap<{ foo: UcModel<string> }>({ foo: String })),
        },
      });

      ({ writeList } = await compiler.evaluate());
    });

    it('serializes list', async () => {
      await expect(
        TextOutStream.read(async to => await writeList(to, [{ foo: 'bar' }, { foo: 'baz' }])),
      ).resolves.toBe(',foo(bar),foo(baz)');
    });
  });

  describe('nested list', () => {
    let compiler: UcsCompiler<{ writeList: UcList.Schema<number[]> }>;

    beforeAll(() => {
      compiler = new UcsCompiler({
        models: {
          writeList: ucList<number[]>(ucList<number>(Number)),
        },
      });
    });

    it('serialized with one item', async () => {
      const { writeList } = await compiler.evaluate();

      await expect(
        TextOutStream.read(async to => await writeList(to, [[1, 22, 333]])),
      ).resolves.toBe(',(1,22,333)');
    });
    it('serialized with multiple items', async () => {
      const { writeList } = await compiler.evaluate();

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
      const { writeList } = await compiler.evaluate();

      await expect(TextOutStream.read(async to => await writeList(to, [[]]))).resolves.toBe(',()');
    });
  });

  it('does not serialize unrecognized schema', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeList: ucList<number>({ type: 'test-type' }),
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
    expect(error?.message).toBe(
      'list$serialize(writer, value, asItem?): Can not serialize list item of type "test-type"',
    );
  });
});
