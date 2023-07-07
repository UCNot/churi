import { beforeEach, describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { UcRejection } from '../schema/uc-error.js';
import { UcrxContext } from './ucrx-context.js';
import { VoidUcrx } from './void.ucrx.js';

describe('VoidUcrx', () => {
  let rejections: UcRejection[];
  let cx: UcrxContext;

  beforeEach(() => {
    rejections = [];
    cx = {
      reject: rejection => {
        rejections.push(rejection);

        return 0;
      },
    } as Partial<UcrxContext> as UcrxContext;
  });

  describe('types', () => {
    it('contains only void', () => {
      expect(new VoidUcrx(noop).types).toEqual(['void']);
    });
  });

  describe('met', () => {
    it('ignores meta', () => {
      const ucrx = new VoidUcrx(noop);

      expect(ucrx.att('test', cx)).toBeUndefined();
    });
  });

  describe('str', () => {
    it('rejects value', () => {
      let assigned: unknown;
      const ucrx = new VoidUcrx(value => {
        assigned = value;
      });

      expect(ucrx.str('test', cx)).toBe(0);
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
