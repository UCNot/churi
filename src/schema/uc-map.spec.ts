import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcsLib } from '../compiler/serialization/ucs-lib.js';
import { TextOutStream } from '../spec/text-out-stream.js';
import { UcMap } from './uc-map.js';
import { UcNumber, UcString } from './uc-primitive.js';
import { UcSchemaResolver } from './uc-schema-resolver.js';
import { UcSchema } from './uc-schema.js';

describe('UcMapSchema', () => {
  class EntrySchema<out T> implements UcSchema<T> {

    readonly #type: string;
    readonly #flags: number | undefined;

    constructor(type: string, flags?: number) {
      this.#type = type;
      this.#flags = flags;
    }

    get from(): string {
      return 'test-library';
    }

    get type(): string {
      return this.#type;
    }

    get flags(): number | undefined {
      return this.#flags;
    }

    asis(value: T): T {
      return value;
    }

}

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
          writeMap: resolver.schemaOf(
            UcMap({
              foo: UcString(),
              bar: UcNumber(),
            }),
          ),
        },
      });

      const { writeMap } = await lib.compile().toSerializers();

      await expect(
        TextOutStream.read(async to => await writeMap(to, { foo: 'test', bar: 13 })),
      ).resolves.toBe("foo('test)bar(13)");
    });
  });
});
