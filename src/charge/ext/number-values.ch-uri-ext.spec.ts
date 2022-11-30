import { describe, expect, it } from '@jest/globals';
import { parseURICharge } from '../parse-uri-charge.js';

describe('NumberValuesChURIExt', () => {
  describe('Infinity', () => {
    it('recognized as top-level value', () => {
      expect(parseURICharge('!Infinity').charge).toBe(Infinity);
    });
    it('recognized as map entry value', () => {
      expect(parseURICharge('foo(!Infinity)').charge).toEqual({ foo: Infinity });
    });
    it('recognized as list item value', () => {
      expect(parseURICharge('(!Infinity)').charge).toEqual([Infinity]);
    });

    describe('-Infinity', () => {
      it('recognized as top-level value', () => {
        expect(parseURICharge('!-Infinity').charge).toBe(-Infinity);
      });
      it('recognized as map entry value', () => {
        expect(parseURICharge('foo(!-Infinity)').charge).toEqual({ foo: -Infinity });
      });
      it('recognized as list item value', () => {
        expect(parseURICharge('(!-Infinity)').charge).toEqual([-Infinity]);
      });
    });

    describe('NaN', () => {
      it('recognized as top-level value', () => {
        expect(parseURICharge('!NaN').charge).toBeNaN();
      });
      it('recognized as map entry value', () => {
        expect(parseURICharge('foo(!NaN)').charge).toEqual({ foo: NaN });
      });
      it('recognized as list item value', () => {
        expect(parseURICharge('(!NaN)').charge).toEqual([NaN]);
      });
    });
  });
});
