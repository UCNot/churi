import { describe, expect, it } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { ucOptional } from './uc-optional.js';
import { UcNumber } from './uc-primitive.js';
import { UcSchema } from './uc-schema.js';

describe('ucOptional', () => {
  it('makes schema optional', () => {
    const modified: UcSchema<number> & { readonly optional: true } = ucOptional(UcNumber());

    expect(modified).toEqual({ ...UcNumber(), optional: true });
  });
  it('makes schema non-optional', () => {
    const modified: UcSchema<number> & { readonly optional?: false | undefined } = ucOptional(
      ucOptional(UcNumber()),
      false,
    );

    expect(modified).toEqual({ ...UcNumber(), optional: false });
  });
  it('leaves the schema as is', () => {
    const modified: UcSchema<number> & { readonly optional?: false | undefined } = ucOptional(
      UcNumber(),
      false,
    );

    expect(modified).toBe(UcNumber());
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
