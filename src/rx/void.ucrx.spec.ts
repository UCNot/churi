import { beforeEach, describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { UcrxReject, UcrxRejection } from './ucrx-rejection.js';
import { VoidUcrx } from './void.ucrx.js';

describe('VoidUcrx', () => {
  let rejections: UcrxRejection[];
  let reject: UcrxReject;

  beforeEach(() => {
    rejections = [];
    reject = rejection => {
      rejections.push(rejection);

      return 0;
    };
  });

  describe('types', () => {
    it('contains only void', () => {
      expect(new VoidUcrx(noop).types).toEqual(['void']);
    });
  });

  describe('met', () => {
    it('ignores meta', () => {
      const ucrx = new VoidUcrx(noop);

      expect(ucrx.att('test', reject)).toBeUndefined();
    });
  });

  describe('str', () => {
    it('rejects value', () => {
      let assigned: unknown;
      const ucrx = new VoidUcrx(value => {
        assigned = value;
      });

      expect(ucrx.str('test', reject)).toBe(0);
      expect(assigned).toBeUndefined();
      expect(rejections).toEqual([
        {
          code: 'unexpectedType',
          details: {
            type: 'string',
            expected: {
              types: ['void'],
            },
          },
          message: `Unexpected string instead of void`,
        },
      ]);
    });
  });
});
