import { describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { VoidUcrx } from './void.ucrx.js';

describe('VoidUcrx', () => {
  describe('types', () => {
    it('contains only void', () => {
      expect(new VoidUcrx(noop).types).toEqual(['void']);
    });
  });

  describe('any', () => {
    it('has no effect', () => {
      let assigned: unknown;
      const ucrx = new VoidUcrx(value => {
        assigned = value;
      });

      expect(ucrx.any('test')).toBe(0);
      expect(assigned).toBeUndefined();
    });
  });
});
