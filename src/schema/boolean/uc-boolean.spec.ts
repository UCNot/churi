import { describe, expect, it } from '@jest/globals';
import { ucBoolean } from './uc-boolean.js';

describe('ucBoolean', () => {
  it('creates boolean schema', () => {
    expect(
      ucBoolean({
        with: { deserializer: { use: { from: 'test-module', feature: 'test-feature' } } },
      }),
    ).toEqual({
      type: Boolean,
      optional: false,
      nullable: false,
      with: { deserializer: { use: { from: 'test-module', feature: 'test-feature' } } },
    });
  });
});
