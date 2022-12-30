import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcList } from './uc-list.js';
import { UcString } from './uc-primitive.js';
import { UcSchemaResolver } from './uc-schema-resolver.js';

describe('UcList', () => {
  const spec = UcList<string>(() => UcString);

  let resolver: UcSchemaResolver;
  let schema: UcList.Schema<string>;

  beforeEach(() => {
    resolver = new UcSchemaResolver();
    schema = resolver.schemaOf(spec);
  });

  describe('item', () => {
    it('contains item schema', () => {
      expect(resolver.schemaOf(spec).item).toBe(UcString);
    });
  });

  describe('type', () => {
    it('is set to `list`', () => {
      expect(schema.from).toBe('@hatsy/churi');
      expect(schema.type).toBe('list');
    });
  });
});
