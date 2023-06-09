import { describe, expect, it } from '@jest/globals';
import { ucString } from './uc-string.js';

describe('ucString', () => {
  it('creates string schema', () => {
    expect(
      ucString({
        with: { deserializer: { use: { from: 'test-module', feature: 'test-feature' } } },
      }),
    ).toEqual({
      type: String,
      optional: false,
      nullable: false,
      with: { deserializer: { use: { from: 'test-module', feature: 'test-feature' } } },
    });
  });
});
