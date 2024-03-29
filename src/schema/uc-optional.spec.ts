import { describe, expect, it } from '@jest/globals';
import { UcOptional, UcRequired, ucOptional } from './uc-optional.js';
import { UcSchema } from './uc-schema.js';

describe('ucOptional', () => {
  it('makes schema optional', () => {
    const modified: UcOptional<number> = ucOptional<number>(Number);

    expect(modified).toEqual({ optional: true, nullable: false, type: Number });
  });
  it('makes schema non-optional', () => {
    const modified: UcRequired<number> = ucOptional(ucOptional<number>(Number), false);

    expect(modified).toEqual({ optional: false, nullable: false, type: Number });
  });
  it('leaves the schema as is', () => {
    const schema: UcSchema<number> = { optional: false, nullable: false, type: Number };
    const modified: UcRequired<number> = ucOptional<number>(schema, false);

    expect(modified).toBe(schema);
  });
  it('creates schema for class', () => {
    class TestValue {}

    expect(ucOptional(TestValue)).toEqual({
      optional: true,
      nullable: false,
      type: TestValue,
    });
  });
});
