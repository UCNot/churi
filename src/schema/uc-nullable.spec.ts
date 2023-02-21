import { describe, expect, it } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { UcNonNullable, UcNullable, ucNullable } from './uc-nullable.js';
import { UcSchemaResolver } from './uc-schema-resolver.js';
import { UcSchema, ucSchemaRef } from './uc-schema.js';

describe('ucNullable', () => {
  it('makes schema nullable', () => {
    const modified: UcNullable<number> = ucNullable<number>(Number);

    expect(modified).toEqual({ optional: false, nullable: true, type: Number, asis });
  });
  it('makes schema non-nullable', () => {
    const modified: UcNonNullable<number> = ucNullable(ucNullable<number>(Number), false);

    expect(modified).toEqual({ optional: false, nullable: false, type: Number, asis });
  });
  it('makes reference nullable', () => {
    const modified: UcNullable.Spec<number> = ucNullable(
      ucSchemaRef<number>(r => r.schemaOf<number>(Number)),
    );

    expect(new UcSchemaResolver().schemaOf(modified)).toEqual({
      nullable: true,
      optional: false,
      type: Number,
      asis,
    });
  });
  it('leaves the schema as is', () => {
    const schema: UcSchema<number> = { optional: false, nullable: false, type: Number, asis };
    const modified: UcNonNullable<number> = ucNullable<number>(schema, false);

    expect(modified).toBe(schema);
  });
  it('creates schema for class', () => {
    class TestValue {}

    expect(ucNullable(TestValue)).toEqual({
      optional: false,
      nullable: true,
      type: TestValue,
      asis,
    });
  });
});
