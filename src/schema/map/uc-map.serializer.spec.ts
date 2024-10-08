import { describe, expect, it } from '@jest/globals';
import { UnsupportedUcSchemaError } from '../../compiler/common/unsupported-uc-schema.error.js';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucList } from '../list/uc-list.js';
import { ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { UcDataType } from '../uc-schema.js';
import { ucMap } from './uc-map.js';

describe('UcMap serializer', () => {
  it('serializes map', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: ucMap({
            foo: String,
            bar: Number,
          }),
        },
      },
    });

    const { writeMap } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeMap(to, { foo: 'test', bar: 13 })),
    ).resolves.toBe('foo(test)bar(13)');
  });
  it('serializes nested map', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: ucMap({
            foo: ucMap({
              test1: Number,
            }),
            bar: ucMap({
              test2: Number,
            }),
          }),
        },
      },
    });

    const { writeMap } = await compiler.evaluate();

    await expect(
      TextOutStream.read(
        async to => await writeMap(to, { foo: { test1: 11 }, bar: { test2: 22 } }),
      ),
    ).resolves.toBe('foo(test1(11))bar(test2(22))');
  });
  it('serializes list entry', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: ucMap({
            foo: ucList(Number),
            bar: ucList<number[]>(ucList(Number)),
          }),
        },
      },
    });

    const { writeMap } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeMap(to, { foo: [11], bar: [[22, 333]] })),
    ).resolves.toBe('foo(,11)bar(,(22,333))');
  });
  it('serializes entry with empty key', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: ucMap({
            '': String,
          }),
        },
      },
    });

    const { writeMap } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeMap(to, { '': 'test' }))).resolves.toBe(
      '$(test)',
    );
  });
  it('serializes entry with special keys', async () => {
    const specialKey = '(%)\r\n\t\uD83D\uDFB1 ';
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: ucMap({
            "'": String,
            '!': String,
            $: String,
            '\\': Number,
            [specialKey]: String,
          }),
        },
      },
    });

    const { writeMap } = await compiler.evaluate();

    await expect(
      TextOutStream.read(
        async to =>
          await writeMap(to, {
            "'": 'quote',
            '!': 'exclamation',
            $: 'dollar',
            '\\': 13,
            [specialKey]: '13',
          }),
      ),
    ).resolves.toBe("$'(quote)$!(exclamation)$$(dollar)\\(13)%28%25%29%0D%0A%09\uD83D\uDFB1 ('13)");
  });
  it('serializes nullable entry', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: ucMap({
            test: ucNullable(String),
          }),
        },
      },
    });

    const { writeMap } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeMap(to, { test: 'value' })),
    ).resolves.toBe('test(value)');
    await expect(TextOutStream.read(async to => await writeMap(to, { test: null }))).resolves.toBe(
      'test(--)',
    );
  });
  it('serializes optional nullable entry', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: ucMap({
            test: ucOptional(ucNullable(String)),
          }),
        },
      },
    });

    const { writeMap } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeMap(to, { test: 'value' })),
    ).resolves.toBe('test(value)');
    await expect(TextOutStream.read(async to => await writeMap(to, { test: null }))).resolves.toBe(
      'test(--)',
    );
    await expect(TextOutStream.read(async to => await writeMap(to, {}))).resolves.toBe('$');
  });
  it('serializes second entry with empty key', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: ucMap({
            first: Number,
            '': String,
          }),
        },
      },
    });

    const { writeMap } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeMap(to, { first: 1, '': 'test' })),
    ).resolves.toBe('first(1)$(test)');
  });
  it('serializes entry with empty key following optional key', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: ucMap({
            first: ucOptional(Number),
            '': String,
          }),
        },
      },
    });

    const { writeMap } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeMap(to, { first: 1, '': 'test' })),
    ).resolves.toBe('first(1)$(test)');
    await expect(TextOutStream.read(async to => await writeMap(to, { '': 'test' }))).resolves.toBe(
      '$(test)',
    );
  });
  it('serializes second entry with empty key when first one is optional', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: ucMap({
            first: ucOptional(Number),
            '': String,
          }),
        },
      },
    });

    const { writeMap } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeMap(to, { first: 1, '': 'test' })),
    ).resolves.toBe('first(1)$(test)');
    await expect(
      TextOutStream.read(async to => await writeMap(to, { first: undefined, '': 'test' })),
    ).resolves.toBe('$(test)');
  });
  it('fails to serialize unrecognized entry schema', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeMap: {
          model: ucMap({
            test: { type: 'test-type' },
          }),
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
      'map$charge(writer, value, asItem?): Can not serialize entry "test" of type "test-type"',
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
              },
            ),
          },
        },
      });

      const { writeMap } = await compiler.evaluate();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { foo: 'test', bar: '123', '': 'some' })),
      ).resolves.toBe("foo(test)bar('123)$(some)");
    });
    it('serializes map with required and extra items', async () => {
      const schema = ucMap<{ first: UcDataType<number> }, UcDataType<string>>(
        {
          first: Number,
        },
        {
          extra: String,
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

      await expect(
        TextOutStream.read(async to => await writeMap(to, { first: 12, foo: 'test', bar: '123' })),
      ).resolves.toBe("first(12)foo(test)bar('123)");
    });
    it('serializes map with nullable and extra items', async () => {
      const schema = ucMap(
        {
          first: Number,
        },
        {
          extra: ucNullable<string>(String),
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

      await expect(
        TextOutStream.read(async to => await writeMap(to, { first: 12, foo: null, bar: '123' })),
      ).resolves.toBe("first(12)foo(--)bar('123)");
    });
    it('fails to serialize unrecognized extra entry schema', async () => {
      const compiler = new UcsCompiler({
        models: {
          writeMap: {
            model: ucMap(
              {},
              {
                extra: { type: 'test-type' },
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
        'map$charge(writer, value, asItem?): Can not serialize extra entry of type "test-type"',
      );
    });
    it('reuses map keys', async () => {
      const compiler = new UcsCompiler({
        models: {
          writeFirst: {
            model: ucMap(
              {
                first: Number,
              },
              {
                extra: String,
              },
            ),
          },
          writeSecond: {
            model: ucMap(
              {
                first: Boolean,
              },
              {
                extra: String,
              },
            ),
          },
        },
      });

      const text = await compiler.generate();
      const re = /const Map\$keys/g;

      expect(re.exec(text)).toBeTruthy();
      expect(re.exec(text)).toBeNull();

      const { writeFirst, writeSecond } = await compiler.evaluate();

      await expect(
        TextOutStream.read(async to => await writeFirst(to, { first: 12, foo: 'test' })),
      ).resolves.toBe('first(12)foo(test)');
      await expect(
        TextOutStream.read(async to => await writeSecond(to, { first: true, foo: 'test' })),
      ).resolves.toBe('first(!)foo(test)');
    });
  });
});
