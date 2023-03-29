import { beforeEach, describe, expect, it } from '@jest/globals';
import { ucSchemaName } from '../uc-schema-name.js';
import { UcSchemaResolver } from '../uc-schema-resolver.js';
import { ucSchemaRef } from '../uc-schema.js';
import { UcList, ucList } from './uc-list.js';

describe('UcList', () => {
  const spec = ucList<string>(ucSchemaRef<string>(() => String));

  let resolver: UcSchemaResolver;
  let schema: UcList.Schema<string>;

  beforeEach(() => {
    resolver = new UcSchemaResolver();
    schema = resolver.schemaOf(spec);
  });

  describe('item', () => {
    it('contains item schema', () => {
      expect(resolver.schemaOf(spec).item).toEqual({
        optional: false,
        nullable: false,
        type: String,
      });
    });
  });

  describe('type', () => {
    it('is set to `list`', () => {
      expect(schema.type).toBe('list');
    });
  });

  describe('name', () => {
    it('reflects item type', () => {
      expect(ucSchemaName(schema)).toBe('String[]');
    });
  });
});
