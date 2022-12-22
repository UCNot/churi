import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcSchema, UC_DATA_ENCODED } from './uc-schema.js';

describe('UcSchema', () => {
  describe('optional', () => {
    it('is `false` by default', () => {
      const schema: UcSchema.Mandatory<string> = new UcSchema({
        library: 'test',
        type: 'test',
      });

      expect(schema.optional).toBe(false);
    });
    it('is `true` when overridden', () => {
      const schema: UcSchema.Optional<string> = new UcSchema({
        optional: true,
        library: 'test',
        type: 'test',
      });

      expect(schema.optional).toBe(true);
    });
  });

  describe('nullable', () => {
    it('is `false` by default', () => {
      const schema: UcSchema.Mandatory<string> = new UcSchema({
        library: 'test',
        type: 'test',
      });

      expect(schema.nullable).toBe(false);
    });
    it('is `true` when overridden', () => {
      const schema: UcSchema.Nullable<string> = new UcSchema({
        nullable: true,
        library: 'test',
        type: 'test',
      });

      expect(schema.nullable).toBe(true);
    });
  });

  describe('flags', () => {
    it('is zero by default', () => {
      expect(new UcSchema({ library: 'test', type: 'test' }).flags).toBe(0);
    });
    it('accepts custom value', () => {
      expect(new UcSchema({ library: 'test', type: 'test', flags: UC_DATA_ENCODED }).flags).toBe(
        UC_DATA_ENCODED,
      );
    });
  });

  describe('type', () => {
    it('accepts custom value', () => {
      const schema: UcSchema.Mandatory<string> = new UcSchema({
        library: 'test-library',
        type: 'test-type',
      });

      expect(schema.library).toBe('test-library');
      expect(schema.type).toBe('test-type');
    });
  });

  describe('makeOptional', () => {
    let base: UcSchema.Mandatory<string>;

    beforeAll(() => {
      base = new UcSchema({ library: 'test', type: 'test' });
    });

    it('makes schema optional', () => {
      const schema: UcSchema.Optional<string> = base.makeOptional();

      expect(schema).not.toBe(base);
      expect(schema.optional).toBe(true);
    });
    it('makes optional schema non-optional', () => {
      const schema: UcSchema.Mandatory<string> = base.makeOptional().makeOptional(false);

      expect(schema).not.toBe(base);
      expect(schema.optional).toBe(false);
    });
    it('does not alter schema', () => {
      const schema: UcSchema.Mandatory<string> = base.makeOptional(false);

      expect(schema).toBe(base);
      expect(schema.optional).toBe(false);
    });
  });

  describe('makeNullable', () => {
    let base: UcSchema.Mandatory<string>;

    beforeAll(() => {
      base = new UcSchema({ library: 'test', type: 'test' });
    });

    it('makes schema nullable', () => {
      const schema: UcSchema.Nullable<string> = base.makeNullable();

      expect(schema).not.toBe(base);
      expect(schema.nullable).toBe(true);
    });
    it('makes nullable schema non-nullable', () => {
      const schema: UcSchema.Mandatory<string> = base.makeNullable().makeNullable(false);

      expect(schema).not.toBe(base);
      expect(schema.nullable).toBe(false);
    });
    it('does not alter schema', () => {
      const schema: UcSchema.Mandatory<string> = base.makeNullable(false);

      expect(schema).toBe(base);
      expect(schema.nullable).toBe(false);
    });
  });
});
