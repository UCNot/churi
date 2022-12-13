import { describe, expect, it } from '@jest/globals';
import { parseChURIValue } from '../parse-churi-value.js';

describe('NumberValuesURIChargeExt', () => {
  describe('Infinity', () => {
    it('recognized as top-level value', () => {
      expect(parseChURIValue('!Infinity').charge).toBe(Infinity);
    });
    it('recognized as map entry value', () => {
      expect(parseChURIValue('foo(!Infinity)').charge).toEqual({ foo: Infinity });
    });
    it('recognized as list item value', () => {
      expect(parseChURIValue('(!Infinity)').charge).toEqual([Infinity]);
    });

    describe('-Infinity', () => {
      it('recognized as top-level value', () => {
        expect(parseChURIValue('!-Infinity').charge).toBe(-Infinity);
      });
      it('recognized as map entry value', () => {
        expect(parseChURIValue('foo(!-Infinity)').charge).toEqual({ foo: -Infinity });
      });
      it('recognized as list item value', () => {
        expect(parseChURIValue('(!-Infinity)').charge).toEqual([-Infinity]);
      });
    });

    describe('NaN', () => {
      it('recognized as top-level value', () => {
        expect(parseChURIValue('!NaN').charge).toBeNaN();
      });
      it('recognized as map entry value', () => {
        expect(parseChURIValue('foo(!NaN)').charge).toEqual({ foo: NaN });
      });
      it('recognized as list item value', () => {
        expect(parseChURIValue('(!NaN)').charge).toEqual([NaN]);
      });
    });
  });
});
