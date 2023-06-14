import { describe, expect, it } from '@jest/globals';
import { ucNumber } from './uc-number.js';

describe('ucNumber', () => {
  it('creates number schema', () => {
    expect(
      ucNumber({
        where: { deserializer: { use: 'test-feature', from: 'test-module' } },
      }),
    ).toEqual({
      type: Number,
      optional: false,
      nullable: false,
      where: { deserializer: { use: 'test-feature', from: 'test-module' } },
    });
  });
});
