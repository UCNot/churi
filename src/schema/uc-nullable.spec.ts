import { describe, expect, it } from '@jest/globals';
import { ucNullable } from './uc-nullable.js';
import { UcNumber } from './uc-primitive.js';
import { UcSchema } from './uc-schema.js';

describe('ucNullable', () => {
  it('makes schema nullable', () => {
    const modified: UcSchema<number> & { readonly nullable: true } = ucNullable(UcNumber());

    expect(modified).toEqual({ ...UcNumber(), nullable: true });
  });
  it('makes schema non-nullable', () => {
    const modified: UcSchema<number> & { readonly nullable?: false | undefined } = ucNullable(
      ucNullable(UcNumber()),
      false,
    );

    expect(modified).toEqual({ ...UcNumber(), nullable: false });
  });
  it('leaves the schema as is', () => {
    const modified: UcSchema<number> & { readonly nullable?: false | undefined } = ucNullable(
      UcNumber(),
      false,
    );

    expect(modified).toBe(UcNumber());
  });
});
