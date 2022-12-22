import { describe, expect, it } from '@jest/globals';
import { UcMapSchema } from './uc-map-schema.js';
import { UcSchema, UC_DATA_ENCODED } from './uc-schema.js';

describe('UcMapSchema', () => {
  class EntrySchema<T> extends UcSchema<T> {

    #type: string;
    #flags: number;

    constructor(type: string, flags = 0) {
      super();
      this.#type = type;
      this.#flags = flags;
    }

    override get library(): string {
      return 'test-library';
    }

    override get type(): string {
      return this.#type;
    }

    override get flags(): number {
      return this.#flags;
    }

    protected override clone(): EntrySchema<T> {
      const clone = super.clone() as EntrySchema<T>;

      clone.#type = this.type;
      clone.#flags = this.flags;

      return clone;
    }

}

  const schema = new UcMapSchema({
    entries: {
      foo: new EntrySchema<string>('test-string'),
      bar: new EntrySchema<number>('test-number'),
    },
  });

  describe('entries', () => {
    it('reflect initial entries', () => {
      expect([...Object.keys(schema.entries)]).toEqual(['foo', 'bar']);
    });
    it('preserved by clone', () => {
      const clone = schema.makeNullable();

      expect(clone).not.toBe(schema);
      expect(clone.entries).toBe(schema.entries);
    });
  });

  describe('type', () => {
    it('is set to `map`', () => {
      expect(schema.library).toBe('@hatsy/churi');
      expect(schema.type).toBe('map');
    });
  });

  describe('flags', () => {
    it('ignores irrelevant flags', () => {
      const schema = new UcMapSchema({
        entries: {
          foo: new EntrySchema<string>('test-string', 0b1000000),
          bar: new EntrySchema<number>('test-number', 0b1111000000),
        },
      });

      expect(schema.flags).toBe(0);
    });
    it('combines flags', () => {
      const schema = new UcMapSchema({
        entries: {
          foo: new EntrySchema<string>('test-string', 0b1000000),
          bar: new EntrySchema<number>('test-number', UC_DATA_ENCODED),
        },
      });

      expect(schema.flags).toBe(UC_DATA_ENCODED);
    });
  });
});
