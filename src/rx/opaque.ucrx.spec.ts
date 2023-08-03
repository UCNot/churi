import { describe, expect, it } from '@jest/globals';
import { noop } from '@proc7ts/primitives';
import { ucOpaqueLexer } from '../syntax/formats/uc-opaque.lexer.js';
import { UC_TOKEN_INSET_URI_PARAM } from '../syntax/uc-token.js';
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

  describe('att', () => {
    it('returns undefined', () => {
      expect(new OpaqueUcrx().att('name')).toBeUndefined();
    });
  });

  describe('emb', () => {
    it('returns ucOpaqueLexer', () => {
      expect(new OpaqueUcrx().ins(UC_TOKEN_INSET_URI_PARAM, noop)).toBe(ucOpaqueLexer);
    });
  });

  describe('raw', () => {
    it('returns 1', () => {
      expect(new OpaqueUcrx().raw('test')).toBe(1);
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
