import { describe, expect, it } from '@jest/globals';
import { ucBoolean } from './uc-boolean.js';

describe('ucBoolean', () => {
  it('creates boolean schema', () => {
    expect(
      ucBoolean({
        where: { deserializer: { use: 'test-feature', from: 'test-module' } },
      }),
    ).toEqual({
      type: Boolean,
      optional: false,
      nullable: false,
      where: { deserializer: { use: 'test-feature', from: 'test-module' } },
    });
  });
});
