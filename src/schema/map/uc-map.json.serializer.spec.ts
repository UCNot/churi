import { describe, expect, it } from '@jest/globals';
import { UnsupportedUcSchemaError } from '../../compiler/common/unsupported-uc-schema.error.js';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucFormatJSON } from '../../syntax/formats/json/uc-format-json.js';
import { ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { UcInfer } from '../uc-schema.js';
import { ucMap } from './uc-map.js';

describe('UcMap JSON serializer', () => {
  it('serializes map', async () => {
    const schema = ucMap(
      {
        foo: String,
        bar: Number,
      },
      {
        where: ucFormatJSON(),
      },
    );
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: schema,
        },
      },
    });

    const { writeMap } = await compiler.evaluate();
    const value: UcInfer<typeof schema> = {
      foo: 'test',
      bar: 13,
    };

    await expect(TextOutStream.read(async to => await writeMap(to, value))).resolves.toBe(
      JSON.stringify(value),
    );
  });
  it('serializes nested map', async () => {
    const schema = ucMap(
      {
        foo: ucMap({
          test1: Number,
        }),
        bar: ucMap({
          test2: Number,
        }),
      },
      {
        where: ucFormatJSON(),
      },
    );
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: schema,
        },
      },
    });

    const { writeMap } = await compiler.evaluate();
    const value: UcInfer<typeof schema> = {
      foo: { test1: 11 },
      bar: { test2: 22 },
    };

    await expect(TextOutStream.read(async to => await writeMap(to, value))).resolves.toBe(
      JSON.stringify(value),
    );
  });
  it('serializes nullable entry', async () => {
    const schema = ucMap(
      {
        test: ucNullable(String),
      },
      {
        where: ucFormatJSON(),
      },
    );
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: schema,
        },
      },
    });

    const { writeMap } = await compiler.evaluate();

    const value1: UcInfer<typeof schema> = { test: 'value' };
    const value2: UcInfer<typeof schema> = { test: null };

    await expect(TextOutStream.read(async to => await writeMap(to, value1))).resolves.toBe(
      JSON.stringify(value1),
    );
    await expect(TextOutStream.read(async to => await writeMap(to, value2))).resolves.toBe(
      JSON.stringify(value2),
    );
  });
  it('serializes optional nullable entry', async () => {
    const schema = ucMap(
      {
        test: ucOptional(ucNullable(String)),
      },
      {
        where: ucFormatJSON(),
      },
    );
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: schema,
        },
      },
    });

    const { writeMap } = await compiler.evaluate();

    const value1 = { test: 'value' };
    const value2 = { test: null };

    await expect(TextOutStream.read(async to => await writeMap(to, value1))).resolves.toBe(
      JSON.stringify(value1),
    );
    await expect(TextOutStream.read(async to => await writeMap(to, value2))).resolves.toBe(
      JSON.stringify(value2),
    );
    await expect(TextOutStream.read(async to => await writeMap(to, {}))).resolves.toBe('{}');
  });
  it('serializes map of optional entries', async () => {
    const schema = ucMap(
      {
        first: ucOptional(Number),
        second: ucOptional(String),
      },
      {
        where: ucFormatJSON(),
      },
    );
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: schema,
        },
      },
    });

    const { writeMap } = await compiler.evaluate();

    const value1: UcInfer<typeof schema> = { first: 1, second: 'test' };
    const value2: UcInfer<typeof schema> = { second: 'test' };
    const value3: UcInfer<typeof schema> = { first: 1 };
    const value4: UcInfer<typeof schema> = {};

    await expect(TextOutStream.read(async to => await writeMap(to, value1))).resolves.toBe(
      JSON.stringify(value1),
    );
    await expect(TextOutStream.read(async to => await writeMap(to, value2))).resolves.toBe(
      JSON.stringify(value2),
    );
    await expect(TextOutStream.read(async to => await writeMap(to, value3))).resolves.toBe(
      JSON.stringify(value3),
    );
    await expect(TextOutStream.read(async to => await writeMap(to, value4))).resolves.toBe(
      JSON.stringify(value4),
    );
  });
  it('serializes second entry when first one is optional', async () => {
    const schema = ucMap(
      {
        first: ucOptional(Number),
        second: String,
      },
      {
        where: ucFormatJSON(),
      },
    );
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: schema,
        },
      },
    });

    const { writeMap } = await compiler.evaluate();

    const value1: UcInfer<typeof schema> = { first: 1, second: 'test' };
    const value2: UcInfer<typeof schema> = { first: undefined, second: 'test' };

    await expect(TextOutStream.read(async to => await writeMap(to, value1))).resolves.toBe(
      JSON.stringify(value1),
    );
    await expect(TextOutStream.read(async to => await writeMap(to, value2))).resolves.toBe(
      JSON.stringify(value2),
    );
  });
  it('fails to serialize unrecognized entry schema', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: ucMap(
            {
              test: { type: 'test-type' },
            },
            { where: ucFormatJSON() },
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
      'map$json(writer, value, asItem?): Can not serialize entry "test" of type "test-type"',
    );
  });

  describe('extra entries', () => {
    it('serializes map with only extra items', async () => {
      const compiler = new UcsCompiler({
        models: {
          writeMap: {
            model: ucMap(
              {},
              {
                extra: String,
                where: ucFormatJSON(),
              },
            ),
          },
        },
      });

      const { writeMap } = await compiler.evaluate();

      const value = { foo: 'test', bar: '123' };

      await expect(TextOutStream.read(async to => await writeMap(to, value))).resolves.toBe(
        JSON.stringify(value),
      );
    });
    it('serializes map with required and extra items', async () => {
      const schema = ucMap(
        {
          first: Number,
        },
        {
          extra: String,
          where: ucFormatJSON(),
        },
      );
      const compiler = new UcsCompiler({
        models: {
          writeMap: {
            model: schema,
          },
        },
      });

      const { writeMap } = await compiler.evaluate();
      const value = { first: 12, foo: 'test', bar: '123' };

      await expect(TextOutStream.read(async to => await writeMap(to, value))).resolves.toBe(
        JSON.stringify(value),
      );
    });
    it('serializes map with nullable and extra items', async () => {
      const schema = ucMap(
        {
          first: Number,
        },
        {
          extra: ucNullable<string>(String),
          where: ucFormatJSON(),
        },
      );
      const compiler = new UcsCompiler({
        models: {
          writeMap: {
            model: schema,
          },
        },
      });

      const { writeMap } = await compiler.evaluate();
      const value = { first: 12, foo: null, bar: '123' };

      await expect(TextOutStream.read(async to => await writeMap(to, value))).resolves.toBe(
        JSON.stringify(value),
      );
    });
    it('fails to serialize unrecognized extra entry schema', async () => {
      const compiler = new UcsCompiler({
        models: {
          writeMap: {
            model: ucMap(
              {},
              {
                extra: { type: 'test-type' },
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
        'map$json(writer, value, asItem?): Can not serialize extra entry of type "test-type"',
      );
    });
  });
});
