import { describe, expect, it } from '@jest/globals';
import { ucBigInt } from './uc-bigint.js';

describe('ucBigInt', () => {
  it('creates bigint schema', () => {
    expect(
      ucBigInt({
        where: { deserializer: { use: 'test-feature', from: 'test-module' } },
      }),
    ).toEqual({
      type: BigInt,
      optional: false,
      nullable: false,
      where: { deserializer: { use: 'test-feature', from: 'test-module' } },
    });
  });
});
