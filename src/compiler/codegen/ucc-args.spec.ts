import { beforeEach, describe, expect, it } from '@jest/globals';
import { UccArgs } from './ucc-args.js';

describe('UccArgs', () => {
  let args: UccArgs<'foo' | 'bar' | 'baz'>;

  beforeEach(() => {
    args = new UccArgs<'foo' | 'bar' | 'baz'>('foo', 'bar');
  });

  describe('byName', () => {
    it('reflect argument names', () => {
      expect(args.byName).toEqual({ foo: 'foo', bar: 'bar' });
    });
    it('caches result', () => {
      expect(args.byName).toBe(args.byName);
    });
  });

  describe('call', () => {
    it('substitutes listed values', () => {
      const binding = args.call({ foo: '1', bar: '2', baz: '3' });

      expect(binding.toString()).toBe(`1, 2`);
      expect(binding.args).toEqual({ foo: '1', bar: '2' });
    });
    it('fails on missing args', () => {
      expect(() => args.call({ foo: '1' })).toThrow(
        new TypeError(`Can not substitute {foo: 1} to (foo, bar) args. "bar" argument is missing`),
      );
    });
  });
});
