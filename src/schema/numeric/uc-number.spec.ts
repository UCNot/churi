import { describe, expect, it } from '@jest/globals';
import { ucNumber } from './uc-number.js';

describe('ucNumber', () => {
  it('creates number schema', () => {
    expect(
      ucNumber({
        with: { deserializer: { use: { from: 'test-module', feature: 'test-feature' } } },
      }),
    ).toEqual({
      type: Number,
      optional: false,
      nullable: false,
      with: { deserializer: { use: { from: 'test-module', feature: 'test-feature' } } },
    });
  });
});
