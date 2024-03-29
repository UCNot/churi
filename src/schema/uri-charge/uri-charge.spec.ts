import { describe, expect, it } from '@jest/globals';
import { UcMeta } from '../meta/uc-meta.js';
import { URICharge } from './uri-charge.js';

describe('URICharge', () => {
  describe('none', () => {
    describe('meta', () => {
      it('is always empty', () => {
        expect(URICharge.none.meta).toBe(UcMeta.empty);
      });
    });

    describe('at', () => {
      it('returns itself for any index', () => {
        expect(URICharge.none.at(0)).toBe(URICharge.none);
        expect(URICharge.none.at(1)).toBe(URICharge.none);
        expect(URICharge.none.at(-1)).toBe(URICharge.none);
        expect(URICharge.none.at(-2)).toBe(URICharge.none);
      });
    });

    describe('get', () => {
      it('returns itself', () => {
        expect(URICharge.none.get('test')).toBe(URICharge.none);
      });
    });

    describe('list', () => {
      it('is empty', () => {
        expect([...URICharge.none.list()]).toHaveLength(0);
      });
    });

    describe('entries', () => {
      it('is empty list', () => {
        expect([...URICharge.none.entries()]).toHaveLength(0);
      });
    });

    describe('keys', () => {
      it('is empty list', () => {
        expect([...URICharge.none.keys()]).toHaveLength(0);
      });
    });
  });
});
