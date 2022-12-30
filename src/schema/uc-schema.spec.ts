import { describe, expect, it } from '@jest/globals';
import { UcNumber } from './uc-primitive.js';
import { ucNullable, ucOptional, UcSchema } from './uc-schema.js';

describe('ucOptional', () => {
  it('makes schema optional', () => {
    const modified: UcSchema<number> & { readonly optional: true } = ucOptional(UcNumber);

    expect(modified).toEqual({ ...UcNumber, optional: true, like: UcNumber });
  });
  it('makes schema non-optional', () => {
    const modified: UcSchema<number> & { readonly optional?: false | undefined } = ucOptional(
      ucOptional(UcNumber),
      false,
    );

    expect(modified).toEqual({ ...UcNumber, optional: false, like: UcNumber });
  });
  it('leaves the schema as is', () => {
    const modified: UcSchema<number> & { readonly optional?: false | undefined } = ucOptional(
      UcNumber,
      false,
    );

    expect(modified).toBe(UcNumber);
  });
});

describe('ucNullable', () => {
  it('makes schema nullable', () => {
    const modified: UcSchema<number> & { readonly nullable: true } = ucNullable(UcNumber);

    expect(modified).toEqual({ ...UcNumber, nullable: true, like: UcNumber });
  });
  it('makes schema non-nullable', () => {
    const modified: UcSchema<number> & { readonly nullable?: false | undefined } = ucNullable(
      ucNullable(UcNumber),
      false,
    );

    expect(modified).toEqual({ ...UcNumber, nullable: false, like: UcNumber });
  });
  it('leaves the schema as is', () => {
    const modified: UcSchema<number> & { readonly nullable?: false | undefined } = ucNullable(
      UcNumber,
      false,
    );

    expect(modified).toBe(UcNumber);
  });
});
