import { beforeEach, describe, expect, it } from '@jest/globals';
import { ucSchemaName } from '../uc-schema-name.js';
import { UcSchema } from '../uc-schema.js';
import { UcMap, ucMap } from './uc-map.js';

describe('UcMap', () => {
  let schema: UcMap.Schema<{ foo: UcSchema<string>; bar: UcSchema<number> }>;

  beforeEach(() => {
    schema = ucMap({
      foo: new EntrySchema<string>('test-string'),
      bar: new EntrySchema<number>('test-number'),
    });
  });

  describe('entries', () => {
    it('contains per-entry schema', () => {
      expect([...Object.keys(schema.entries)]).toEqual(['foo', 'bar']);
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
      const schema = ucMap({
        foo: new EntrySchema<string>('test-string'),
        '0abc': new EntrySchema<string>('test-string'),
        '%abc': new EntrySchema<string>('test-string'),
        bar: new EntrySchema<string>('test-string'),
      });

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
