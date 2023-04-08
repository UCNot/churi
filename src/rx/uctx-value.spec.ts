import { describe, expect, it } from '@jest/globals';
import { TokenUcrx } from './token.ucrx.js';
import { Ucrx } from './ucrx.js';

describe('uctxValue', () => {
  it('handles unsupported list', () => {
    class TestUcrx extends TokenUcrx {

      override nls(): this {
        return undefined!;
      }

}

    expect(TestUcrx.charge([1, 2, 3], { asItem: true })).toEqual([]);
  });

  it('handles unsupported map', () => {
    class TestUcrx extends TokenUcrx {

      override for(_key: PropertyKey): Ucrx {
        return 0 as any;
      }

}

    expect(TestUcrx.charge({ a: 1 })).toEqual([]);
  });
});
