import { describe, expect, it } from '@jest/globals';
import { OpaqueUcrx } from './opaque.ucrx.js';

describe('OpaqueUcrx', () => {
  describe('types', () => {
    it('contains any', () => {
      expect(new OpaqueUcrx().types).toEqual(['any']);
    });
  });

  describe('any', () => {
    it('succeeds, but has no effect', () => {
      let assigned: unknown;
      const ucrx = new OpaqueUcrx();

      expect(ucrx.any('test')).toBe(1);
      expect(assigned).toBeUndefined();
    });
  });

  describe('set', () => {
    it('has no effect', () => {
      class TestUcrx extends OpaqueUcrx {

        override any(value: unknown): 1 {
          return this.set(value);
        }

}

      let assigned: unknown;
      const ucrx = new TestUcrx();

      expect(ucrx.any('test')).toBe(1);
      expect(assigned).toBeUndefined();
    });
  });

  describe('for', () => {
    it('returns itself', () => {
      const ucrx = new OpaqueUcrx();

      expect(ucrx.for('test')).toBe(ucrx);
    });
  });

  describe('nls', () => {
    it('returns itself', () => {
      const ucrx = new OpaqueUcrx();

      expect(ucrx.nls()).toBe(ucrx);
    });
  });

  describe('em', () => {
    it('always succeeds', () => {
      const ucrx = new OpaqueUcrx();

      expect(ucrx.and()).toBe(1);
    });
  });
});
