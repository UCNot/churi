import { beforeEach, describe, expect, it } from '@jest/globals';
import { ucSchemaName } from '../uc-schema-name.js';
import { UcSchema } from '../uc-schema.js';
import { UcMap, ucMap } from './uc-map.js';

describe('UcMap', () => {
  let schema: UcMap.Schema<{ foo: UcSchema<string>; bar: UcSchema<number> }>;

  beforeEach(() => {
    schema = ucMap<{ foo: UcSchema<string>; bar: UcSchema<number> }>({
      foo: { type: 'test-string' },
      bar: { type: 'test-number' },
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
        foo: { type: 'test-string' },
        '0abc': { type: 'test-string' },
        '%abc': { type: 'test-string' },
        bar: { type: 'test-string' },
      });

      expect(ucSchemaName(schema)).toBe(
        `{foo: test-string, '0abc': test-string, '%abc': test-string, ...}`,
      );
    });
  });
});
