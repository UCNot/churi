import { TokenUcrx } from '@hatsy/churi';
import { describe, expect, it } from '@jest/globals';
import { Ucrx } from './ucrx.js';

describe('ucrxValue', () => {
  it('handles unsupported list', () => {
    class TestUcrx extends TokenUcrx {

      override nls(): this {
        return undefined!;
      }

}

    expect(TestUcrx.charge([1, 2, 3])).toEqual([]);
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
