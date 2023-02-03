import { describe, expect, it } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { ucOptional } from './uc-optional.js';
import { UcSchema } from './uc-schema.js';

describe('ucOptional', () => {
  it('makes schema optional', () => {
    const modified: UcSchema<number> & { readonly optional: true } = ucOptional<number>(Number);

    expect(modified).toEqual({ optional: true, nullable: false, type: Number, asis });
  });
  it('makes schema non-optional', () => {
    const modified: UcSchema<number> & { readonly optional?: false | undefined } = ucOptional(
      ucOptional<number>(Number),
      false,
    );

    expect(modified).toEqual({ optional: false, nullable: false, type: Number, asis });
  });
  it('leaves the schema as is', () => {
    const schema: UcSchema<number> = { optional: false, nullable: false, type: Number, asis };
    const modified: UcSchema<number> & { readonly optional?: false | undefined } =
      ucOptional<number>(schema, false);

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
