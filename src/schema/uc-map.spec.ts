import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcMap } from './uc-map.js';
import { UcSchemaResolver } from './uc-schema-resolver.js';
import { UcSchema, UC_DATA_ENCODED } from './uc-schema.js';

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

    // eslint-disable-next-line @typescript-eslint/naming-convention
    asis(value: T): T {
      return value;
    }

}

  const spec = UcMap({
    foo: new EntrySchema<string>('test-string'),
    bar: () => new EntrySchema<number>('test-number'),
  });

  let resolver: UcSchemaResolver;
  let schema: UcMap.Schema<{ foo: UcSchema<string>; bar: UcSchema<number> }>;

  beforeEach(() => {
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

  describe('flags', () => {
    it('ignores irrelevant flags', () => {
      const schema = resolver.schemaOf(
        UcMap({
          foo: new EntrySchema<string>('test-string', 0b1000000),
          bar: new EntrySchema<number>('test-number', 0b1111000000),
        }),
      );

      expect(schema.flags).toBe(0);
    });
    it('combines flags', () => {
      const schema = resolver.schemaOf(
        UcMap({
          foo: new EntrySchema<string>('test-string', 0b1000000),
          bar: new EntrySchema<number>('test-number', UC_DATA_ENCODED),
        }),
      );

      expect(schema.flags).toBe(UC_DATA_ENCODED);
    });
  });
});
