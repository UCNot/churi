import { describe, expect, it } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { ucNullable } from './uc-nullable.js';
import { UcSchema } from './uc-schema.js';

describe('ucNullable', () => {
  it('makes schema nullable', () => {
    const modified: UcSchema<number> & { readonly nullable: true } = ucNullable<number>(Number);

    expect(modified).toEqual({ optional: false, nullable: true, type: Number, asis });
  });
  it('makes schema non-nullable', () => {
    const modified: UcSchema<number> & { readonly nullable?: false | undefined } = ucNullable(
      ucNullable<number>(Number),
      false,
    );

    expect(modified).toEqual({ optional: false, nullable: false, type: Number, asis });
  });
  it('leaves the schema as is', () => {
    const schema: UcSchema<number> = { optional: false, nullable: false, type: Number, asis };
    const modified: UcSchema<number> & { readonly nullable?: false | undefined } =
      ucNullable<number>(schema, false);

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
