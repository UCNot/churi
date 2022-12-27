import { describe, expect, it } from '@jest/globals';
import { parseUcValue } from '../charge/parse-uc-value.js';

describe('NonFiniteUcExt', () => {
  describe('Infinity', () => {
    it('recognized as top-level value', () => {
      expect(parseUcValue('!Infinity').charge).toBe(Infinity);
    });
    it('recognized as map entry value', () => {
      expect(parseUcValue('foo(!Infinity)').charge).toEqual({ foo: Infinity });
    });
    it('recognized as list item value', () => {
      expect(parseUcValue('(!Infinity)').charge).toEqual([Infinity]);
    });

    describe('-Infinity', () => {
      it('recognized as top-level value', () => {
        expect(parseUcValue('!-Infinity').charge).toBe(-Infinity);
      });
      it('recognized as map entry value', () => {
        expect(parseUcValue('foo(!-Infinity)').charge).toEqual({ foo: -Infinity });
      });
      it('recognized as list item value', () => {
        expect(parseUcValue('(!-Infinity)').charge).toEqual([-Infinity]);
      });
    });

    describe('NaN', () => {
      it('recognized as top-level value', () => {
        expect(parseUcValue('!NaN').charge).toBeNaN();
      });
      it('recognized as map entry value', () => {
        expect(parseUcValue('foo(!NaN)').charge).toEqual({ foo: NaN });
      });
      it('recognized as list item value', () => {
        expect(parseUcValue('(!NaN)').charge).toEqual([NaN]);
      });
    });
  });
});
