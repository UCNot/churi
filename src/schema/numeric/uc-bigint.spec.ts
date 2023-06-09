import { describe, expect, it } from '@jest/globals';
import { ucBigInt } from './uc-bigint.js';

describe('ucBigInt', () => {
  it('creates bigint schema', () => {
    expect(
      ucBigInt({
        with: { deserializer: { use: { from: 'test-module', feature: 'test-feature' } } },
      }),
    ).toEqual({
      type: BigInt,
      optional: false,
      nullable: false,
      with: { deserializer: { use: { from: 'test-module', feature: 'test-feature' } } },
    });
  });
});
