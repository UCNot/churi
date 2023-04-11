import { describe, expect, it } from '@jest/globals';
import { UcsSetup } from '../../compiler/serialization/ucs-setup.js';
import { UnsupportedUcSchemaError } from '../../compiler/unsupported-uc-schema.error.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucList } from '../list/uc-list.js';
import { ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { ucMap } from './uc-map.js';

describe('UcMap serializer', () => {
  it('serializes map', async () => {
    const lib = await new UcsSetup({
      schemae: {
        writeMap: ucMap({
          foo: String,
          bar: Number,
        }),
      },
    }).bootstrap();

    const { writeMap } = await lib.compile().toSerializers();

    await expect(
      TextOutStream.read(async to => await writeMap(to, { foo: 'test', bar: 13 })),
    ).resolves.toBe("foo('test)bar(13)");
  });
  it('serializes nested map', async () => {
    const lib = await new UcsSetup({
      schemae: {
        writeMap: ucMap({
          foo: ucMap({
            test1: Number,
          }),
          bar: ucMap({
            test2: Number,
          }),
        }),
      },
    }).bootstrap();

    const { writeMap } = await lib.compile().toSerializers();

    await expect(
      TextOutStream.read(
        async to => await writeMap(to, { foo: { test1: 11 }, bar: { test2: 22 } }),
      ),
    ).resolves.toBe('foo(test1(11))bar(test2(22))');
  });
  it('serializes list entry', async () => {
    const lib = await new UcsSetup({
      schemae: {
        writeMap: ucMap({
          foo: ucList(Number),
          bar: ucList<number[]>(ucList(Number)),
        }),
      },
    }).bootstrap();

    const { writeMap } = await lib.compile().toSerializers();

    await expect(
      TextOutStream.read(async to => await writeMap(to, { foo: [11], bar: [[22, 333]] })),
    ).resolves.toBe('foo(,11)bar(,(22,333))');
  });
  it('serializes entry with empty key', async () => {
    const lib = await new UcsSetup({
      schemae: {
        writeMap: ucMap({
          '': String,
        }),
      },
    }).bootstrap();

    const { writeMap } = await lib.compile().toSerializers();

    await expect(TextOutStream.read(async to => await writeMap(to, { '': 'test' }))).resolves.toBe(
      "$('test)",
    );
  });
  it('serializes entry with special keys', async () => {
    const specialKey = '(%)\r\n\t\uD83D\uDFB1 ' as const;
    const lib = await new UcsSetup({
      schemae: {
        writeMap: ucMap({
          "'": String,
          '!': String,
          $: String,
          '\\': Number,
          [specialKey]: String,
        }),
      },
    }).bootstrap();

    const { writeMap } = await lib.compile().toSerializers();

    await expect(
      TextOutStream.read(
        async to => await writeMap(to, {
            "'": 'quote',
            '!': 'exclamation',
            $: 'dollar',
            '\\': 13,
            [specialKey]: '13',
          }),
      ),
    ).resolves.toBe(
      "$'('quote)$!('exclamation)$$('dollar)\\(13)%28%25%29%0D%0A%09\uD83D\uDFB1 ('13)",
    );
  });
  it('serializes nullable entry', async () => {
    const lib = await new UcsSetup({
      schemae: {
        writeMap: ucMap({
          test: ucNullable(String),
        }),
      },
    }).bootstrap();

    const { writeMap } = await lib.compile().toSerializers();

    await expect(
      TextOutStream.read(async to => await writeMap(to, { test: 'value' })),
    ).resolves.toBe("test('value)");
    await expect(TextOutStream.read(async to => await writeMap(to, { test: null }))).resolves.toBe(
      'test(--)',
    );
  });
  it('serializes optional nullable entry', async () => {
    const lib = await new UcsSetup({
      schemae: {
        writeMap: ucMap({
          test: ucOptional(ucNullable(String)),
        }),
      },
    }).bootstrap();

    const { writeMap } = await lib.compile().toSerializers();

    await expect(
      TextOutStream.read(async to => await writeMap(to, { test: 'value' })),
    ).resolves.toBe("test('value)");
    await expect(TextOutStream.read(async to => await writeMap(to, { test: null }))).resolves.toBe(
      'test(--)',
    );
    await expect(TextOutStream.read(async to => await writeMap(to, {}))).resolves.toBe('$');
  });
  it('serializes second entry with empty key', async () => {
    const lib = await new UcsSetup({
      schemae: {
        writeMap: ucMap({
          first: Number,
          '': String,
        }),
      },
    }).bootstrap();

    const { writeMap } = await lib.compile().toSerializers();

    await expect(
      TextOutStream.read(async to => await writeMap(to, { first: 1, '': 'test' })),
    ).resolves.toBe("first(1)$('test)");
  });
  it('serializes second entry with empty key when first one is optional', async () => {
    const lib = await new UcsSetup({
      schemae: {
        writeMap: ucMap({
          first: ucOptional(Number),
          '': String,
        }),
      },
    }).bootstrap();

    const { writeMap } = await lib.compile().toSerializers();

    await expect(
      TextOutStream.read(async to => await writeMap(to, { first: 1, '': 'test' })),
    ).resolves.toBe("first(1)$('test)");
    await expect(
      TextOutStream.read(async to => await writeMap(to, { first: undefined, '': 'test' })),
    ).resolves.toBe("$('test)");
  });
  it('does not serialize unrecognized schema', async () => {
    const lib = await new UcsSetup({
      schemae: {
        writeMap: ucMap({
          test: { type: 'test-type' },
        }),
      },
    }).bootstrap();

    let error: UnsupportedUcSchemaError | undefined;

    try {
      await lib.compile().toSerializers();
    } catch (e) {
      error = e as UnsupportedUcSchemaError;
    }

    expect(error).toBeInstanceOf(UnsupportedUcSchemaError);
    expect(error?.schema.type).toBe('test-type');
    expect(error?.message).toBe(
      'writeMap$serialize: Can not serialize entry "test" of type "test-type"',
    );
    expect(error?.cause).toBeInstanceOf(UnsupportedUcSchemaError);
    expect((error?.cause as UnsupportedUcSchemaError).schema.type).toBe('test-type');
  });
});
