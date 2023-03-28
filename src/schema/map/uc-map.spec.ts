import { beforeEach, describe, expect, it } from '@jest/globals';
import { ucSchemaName } from '../uc-schema-name.js';
import { UcSchemaResolver } from '../uc-schema-resolver.js';
import { UcSchema, ucSchemaRef } from '../uc-schema.js';
import { UcMap, ucMap } from './uc-map.js';

describe('UcMap', () => {
  let spec: UcMap.Schema.Spec<{
    foo: UcSchema<string>;
    bar: UcSchema.Ref<number>;
  }>;
  let resolver: UcSchemaResolver;
  let schema: UcMap.Schema<{ foo: UcSchema<string>; bar: UcSchema<number> }>;

  beforeEach(() => {
    spec = ucMap({
      foo: new EntrySchema<string>('test-string'),
      bar: ucSchemaRef(() => new EntrySchema<number>('test-number')),
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
      expect(schema.type).toBe('map');
    });
  });

  describe('name', () => {
    it('reflects entry schemae', () => {
      expect(ucSchemaName(schema)).toBe('{foo: test-string, bar: test-number}');
    });
    it('reflects only a few entry schemae', () => {
      const spec = ucMap({
        foo: new EntrySchema<string>('test-string'),
        '0abc': new EntrySchema<string>('test-string'),
        '%abc': new EntrySchema<string>('test-string'),
        bar: new EntrySchema<string>('test-string'),
      });
      const schema = resolver.schemaOf(spec);

      expect(ucSchemaName(schema)).toBe(
        `{foo: test-string, '0abc': test-string, '%abc': test-string, ...}`,
      );
    });
  });
});

class EntrySchema<T> implements UcSchema<T> {

  readonly #type: string;

  constructor(type: string) {
    this.#type = type;
  }

  get type(): string {
    return this.#type;
  }

  asis(value: T): T {
    return value;
  }

}
