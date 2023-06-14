import { describe, expect, it } from '@jest/globals';
import { ucString } from './uc-string.js';

describe('ucString', () => {
  it('creates string schema', () => {
    expect(
      ucString({
        where: { deserializer: { use: 'test-feature', from: 'test-module' } },
      }),
    ).toEqual({
      type: String,
      optional: false,
      nullable: false,
      where: { deserializer: { use: 'test-feature', from: 'test-module' } },
    });
  });
});
