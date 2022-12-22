import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcSchema } from './uc-schema.js';

describe('UcSchema', () => {
  describe('optional', () => {
    it('is `false` by default', () => {
      const schema = new TestUcSchema();

      expect(schema.optional).toBe(false);
    });
  });

  describe('nullable', () => {
    it('is `false` by default', () => {
      const schema = new TestUcSchema();

      expect(schema.nullable).toBe(false);
    });
  });

  describe('mandatory', () => {
    it('is `true` by default', () => {
      const schema = new TestUcSchema();

      expect(schema.mandatory).toBe(true);
    });
  });

  describe('flags', () => {
    it('zero by default', () => {
      expect(new TestUcSchema().flags).toBe(0);
    });
  });

  describe('makeMandatory', () => {
    let base: UcSchema<string>;

    beforeAll(() => {
      base = new TestUcSchema();
    });

    it('does not alter mandatory schema', () => {
      const schema: UcSchema.Mandatory<string> = base.makeMandatory();

      expect(schema).toBe(base);
      expect(schema.mandatory).toBe(true);
    });
    it('makes optional schema non-optional', () => {
      const optional: UcSchema.Optional<string> = base.makeOptional();
      const schema: UcSchema.Mandatory<string> = optional.makeMandatory();

      expect(schema).not.toBe(optional);
      expect(schema.mandatory).toBe(true);
      expect(schema.optional).toBe(false);
    });
    it('makes nullable schema non-nullable', () => {
      const optional: UcSchema.Nullable<string> = base.makeNullable();
      const schema: UcSchema.Mandatory<string> = optional.makeMandatory();

      expect(schema).not.toBe(optional);
      expect(schema.mandatory).toBe(true);
      expect(schema.nullable).toBe(false);
    });
    it('does not alter schema', () => {
      const schema: UcSchema.NonOptional<string> = base.makeOptional(false);

      expect(schema).toBe(base);
      expect(schema.optional).toBe(false);
    });
  });

  describe('makeOptional', () => {
    let base: UcSchema<string>;

    beforeAll(() => {
      base = new TestUcSchema();
    });

    it('makes schema optional', () => {
      const schema: UcSchema.Optional<string> = base.makeOptional();

      expect(schema).not.toBe(base);
      expect(schema.optional).toBe(true);
    });
    it('makes optional schema non-optional', () => {
      const schema: UcSchema.NonOptional<string> = base.makeOptional().makeOptional(false);

      expect(schema).not.toBe(base);
      expect(schema.optional).toBe(false);
    });
    it('does not alter schema', () => {
      const schema: UcSchema.NonOptional<string> = base.makeOptional(false);

      expect(schema).toBe(base);
      expect(schema.optional).toBe(false);
    });
  });

  describe('makeNullable', () => {
    let base: UcSchema<string>;

    beforeAll(() => {
      base = new TestUcSchema();
    });

    it('makes schema nullable', () => {
      const schema: UcSchema.Nullable<string> = base.makeNullable();

      expect(schema).not.toBe(base);
      expect(schema.nullable).toBe(true);
    });
    it('makes nullable schema non-nullable', () => {
      const schema: UcSchema.NonNullable<string> = base.makeNullable().makeNullable(false);

      expect(schema).not.toBe(base);
      expect(schema.nullable).toBe(false);
    });
    it('does not alter schema', () => {
      const schema: UcSchema.NonNullable<string> = base.makeNullable(false);

      expect(schema).toBe(base);
      expect(schema.nullable).toBe(false);
    });
  });

  class TestUcSchema extends UcSchema<string> {

    override get library(): string {
      return 'test-library';
    }

    override get type(): string {
      return 'test-type';
    }

}
});
