import { describe, expect, it } from '@jest/globals';
import { UcNonNullable, UcNullable, ucNullable } from './uc-nullable.js';
import { UcSchema } from './uc-schema.js';

describe('ucNullable', () => {
  it('makes schema nullable', () => {
    const modified: UcNullable<number> = ucNullable<number>(Number);

    expect(modified).toEqual({ optional: false, nullable: true, type: Number });
  });
  it('makes schema non-nullable', () => {
    const modified: UcNonNullable<number> = ucNullable(ucNullable<number>(Number), false);

    expect(modified).toEqual({ optional: false, nullable: false, type: Number });
  });
  it('leaves the schema as is', () => {
    const schema: UcSchema<number> = { optional: false, nullable: false, type: Number };
    const modified: UcNonNullable<number> = ucNullable<number>(schema, false);

    expect(modified).toBe(schema);
  });
  it('creates schema for class', () => {
    class TestValue {}

    expect(ucNullable(TestValue)).toEqual({
      optional: false,
      nullable: true,
      type: TestValue,
    });
  });
});
