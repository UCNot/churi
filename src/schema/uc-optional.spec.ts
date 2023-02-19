import { describe, expect, it } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { UcOptional, ucOptional, UcRequired } from './uc-optional.js';
import { UcSchemaResolver } from './uc-schema-resolver.js';
import { UcSchema, ucSchemaRef } from './uc-schema.js';

describe('ucOptional', () => {
  it('makes schema optional', () => {
    const modified: UcOptional<number> = ucOptional<number>(Number);

    expect(modified).toEqual({ optional: true, nullable: false, type: Number, asis });
  });
  it('makes schema non-optional', () => {
    const modified: UcRequired<number> = ucOptional(ucOptional<number>(Number), false);

    expect(modified).toEqual({ optional: false, nullable: false, type: Number, asis });
  });
  it('makes reference optional', () => {
    const modified: UcOptional.Spec<number> = ucOptional(
      ucSchemaRef<number>(r => r.schemaOf<number>(Number)),
    );

    expect(new UcSchemaResolver().schemaOf(modified)).toEqual({
      nullable: false,
      optional: true,
      type: Number,
      asis,
    });
  });
  it('leaves the schema as is', () => {
    const schema: UcSchema<number> = { optional: false, nullable: false, type: Number, asis };
    const modified: UcRequired<number> = ucOptional<number>(schema, false);

    expect(modified).toBe(schema);
  });
  it('creates schema for class', () => {
    class TestValue {}

    expect(ucOptional(TestValue)).toEqual({
      optional: true,
      nullable: false,
      type: TestValue,
      asis,
    });
  });
});
