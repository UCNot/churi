import { beforeAll, describe, expect, it } from '@jest/globals';
import { UnsupportedUcSchemaError } from '../../compiler/common/unsupported-uc-schema.error.js';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { UcsModels } from '../../compiler/serialization/ucs-models.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucFormatJSON } from '../../syntax/formats/json/uc-format-json.js';
import { ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { UcList, ucList } from './uc-list.js';

describe('UcList JSON serializer', () => {
  it('serializes list', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeList: {
          model: ucList(Number, {
            where: ucFormatJSON(),
          }),
        },
      },
    });

    const { writeList } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeList(to, [1, 22, 333]))).resolves.toBe(
      '[1,22,333]',
    );
  });
  it('serializes empty list', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeList: {
          model: ucList(Number, {
            single: 'accept',
            where: ucFormatJSON(),
          }),
        },
      },
    });

    const { writeList } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeList(to, []))).resolves.toBe('[]');
  });
  it('serializes nulls', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeList: {
          model: ucList(ucNullable(Number), {
            where: ucFormatJSON(),
          }),
        },
      },
    });

    const { writeList } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeList(to, [1, null, 333]))).resolves.toBe(
      '[1,null,333]',
    );
  });
  it('serializes missing items as nulls', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeList: {
          model: ucList(ucOptional(Number), {
            where: ucFormatJSON(),
          }),
        },
      },
    });

    const { writeList } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeList(to, [1, undefined, 333])),
    ).resolves.toBe('[1,null,333]');
  });

  describe('nested list', () => {
    let compiler: UcsCompiler<{ writeList: UcsModels.Entry<UcList.Schema<number[]>> }>;

    beforeAll(() => {
      compiler = new UcsCompiler({
        models: {
          writeList: {
            model: ucList<number[]>(ucList<number>(Number), {
              where: ucFormatJSON(),
            }),
          },
        },
      });
    });

    it('serialized with one item', async () => {
      const { writeList } = await compiler.evaluate();

      await expect(
        TextOutStream.read(async to => await writeList(to, [[1, 22, 333]])),
      ).resolves.toBe('[[1,22,333]]');
    });
    it('serialized with multiple items', async () => {
      const { writeList } = await compiler.evaluate();

      await expect(
        TextOutStream.read(
          async to =>
            await writeList(to, [
              [1, 22, 333],
              [1, 2, 3],
            ]),
        ),
      ).resolves.toBe('[[1,22,333],[1,2,3]]');
    });
    it('serialized with empty item', async () => {
      const { writeList } = await compiler.evaluate();

      await expect(TextOutStream.read(async to => await writeList(to, [[]]))).resolves.toBe('[[]]');
    });
  });

  it('does not serialize unrecognized schema', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeList: {
          model: ucList<number>(
            { type: 'test-type' },
            {
              where: ucFormatJSON(),
            },
          ),
        },
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
      'list$json(writer, value, asItem?): Can not serialize list item of type "test-type"',
    );
  });
});
