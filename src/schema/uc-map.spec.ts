import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcsLib } from '../compiler/serialization/ucs-lib.js';
import { UnsupportedUcSchema } from '../compiler/unsupported-uc-schema.js';
import { TextOutStream } from '../spec/text-out-stream.js';
import { UcMap } from './uc-map.js';
import { UcNumber, UcString } from './uc-primitive.js';
import { UcSchemaResolver } from './uc-schema-resolver.js';
import { ucNullable, ucOptional, UcSchema } from './uc-schema.js';

describe('UcMap', () => {
  let spec: UcMap.Schema.Spec<{
    foo: UcSchema<string>;
    bar: () => UcSchema<number>;
  }>;
  let resolver: UcSchemaResolver;
  let schema: UcMap.Schema<{ foo: UcSchema<string>; bar: UcSchema<number> }>;

  beforeEach(() => {
    spec = UcMap({
      foo: new EntrySchema<string>('test-string'),
      bar: () => new EntrySchema<number>('test-number'),
    });
    resolver = new UcSchemaResolver();
    schema = resolver.schemaOf(spec);
  });

  describe('entries', () => {
    it('contains per-entry schema', () => {
      expect([...Object.keys(resolver.schemaOf(spec).entries)]).toEqual(['foo', 'bar']);
    });
  });

  describe('type', () => {
    it('is set to `map`', () => {
      expect(schema.from).toBe('@hatsy/churi');
      expect(schema.type).toBe('map');
    });
  });

  describe('serializer', () => {
    it('serializes map', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: UcMap({
            foo: UcString(),
            bar: UcNumber(),
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { foo: 'test', bar: 13 })),
      ).resolves.toBe("$foo('test)bar(13)");
    });
    it('serializes nested map', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: UcMap({
            foo: UcMap({
              test1: UcNumber(),
            }),
            bar: UcMap({
              test2: UcNumber(),
            }),
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(
          async to => await writeMap(to, { foo: { test1: 11 }, bar: { test2: 22 } }),
        ),
      ).resolves.toBe('$foo($test1(11))bar($test2(22))');
    });
    it('serializes entry with empty key', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: UcMap({
            '': UcString(),
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { '': 'test' })),
      ).resolves.toBe("$('test)");
    });
    it('serializes nullable entry', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: UcMap({
            test: ucNullable(UcString()),
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { test: 'value' })),
      ).resolves.toBe("$test('value)");
      await expect(
        TextOutStream.read(async to => await writeMap(to, { test: null })),
      ).resolves.toBe('$test(--)');
    });
    it('serializes optional nullable entry', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: UcMap({
            test: ucOptional(ucNullable(UcString())),
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { test: 'value' })),
      ).resolves.toBe("$test('value)");
      await expect(
        TextOutStream.read(async to => await writeMap(to, { test: null })),
      ).resolves.toBe('$test(--)');
      await expect(TextOutStream.read(async to => await writeMap(to, {}))).resolves.toBe('$');
    });
    it('serializes second entry with empty key', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: UcMap({
            first: UcNumber(),
            '': UcString(),
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { first: 1, '': 'test' })),
      ).resolves.toBe("$first(1)$('test)");
    });
    it('serializes second entry with empty key when first one is optional', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: UcMap({
            first: ucOptional(UcNumber()),
            '': UcString(),
          }),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { first: 1, '': 'test' })),
      ).resolves.toBe("$first(1)$('test)");
      await expect(
        TextOutStream.read(async to => await writeMap(to, { first: undefined, '': 'test' })),
      ).resolves.toBe("$('test)");
    });
    it('does not serialize unrecognized schema', async () => {
      const lib = new UcsLib({
        schemae: {
          writeMap: UcMap({
            test: new EntrySchema<string>('test-type'),
          }),
        },
      });

      let error: UnsupportedUcSchema | undefined;

      try {
        await lib.compile().toSerializers();
      } catch (e) {
        error = e as UnsupportedUcSchema;
      }

      expect(error).toBeInstanceOf(UnsupportedUcSchema);
      expect(error?.schema.type).toBe('test-type');
      expect(error?.message).toBe(
        'writeMap$serialize: Can not serialize entry "test" of type "test-type" from "test-library"',
      );
      expect(error?.cause).toBeInstanceOf(UnsupportedUcSchema);
      expect((error?.cause as UnsupportedUcSchema).schema.type).toBe('test-type');
    });
  });
});

class EntrySchema<T> implements UcSchema<T> {

  readonly #type: string;

  constructor(type: string) {
    this.#type = type;
  }

  get from(): string {
    return 'test-library';
  }

  get type(): string {
    return this.#type;
  }

  asis(value: T): T {
    return value;
  }

}
