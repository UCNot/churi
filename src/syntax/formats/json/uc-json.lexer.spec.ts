import { describe, expect, it } from '@jest/globals';
import { scanUcTokens } from '../../scan-uc-tokens.js';
import { UcToken } from '../../uc-token.js';
import { UcJSONLexer } from './uc-json.lexer.js';

describe('UcJSONLexer', () => {
  describe('number', () => {
    it('recognizes integer', () => {
      expect(scan('13')).toEqual(['13']);
      expect(scan('-13')).toEqual(['-13']);
      expect(scan('-0')).toEqual(['-0']);
      expect(scan('0')).toEqual(['0']);
    });
    it('recognizes fractional', () => {
      expect(scan('13.934')).toEqual(['13.934']);
      expect(scan('-13.934')).toEqual(['-13.934']);
      expect(scan('-0.934')).toEqual(['-0.934']);
      expect(scan('0.934')).toEqual(['0.934']);
    });
    it('recognizes exponential', () => {
      expect(scan('13.934e19')).toEqual(['13.934e19']);
      expect(scan('13.934E-19')).toEqual(['13.934E-19']);
      expect(scan('13.934E+19')).toEqual(['13.934E+19']);
      expect(scan('-13e19')).toEqual(['-13e19']);
      expect(scan('-13E+19')).toEqual(['-13E+19']);
      expect(scan('-13E-19')).toEqual(['-13E-19']);
      expect(scan('-0.9e19')).toEqual(['-0.9e19']);
      expect(scan('-0E+19')).toEqual(['-0E+19']);
      expect(scan('0.934e13')).toEqual(['0.934e13']);
      expect(scan('0e-13')).toEqual(['0e-13']);
    });
    it('fails on digit after leading 0', () => {
      expect(() => scan('00')).toThrow(new TypeError('Invalid JSON number: 00'));
      expect(() => scan('00.1')).toThrow(new TypeError('Invalid JSON number: 00.1'));
      expect(() => scan('-01')).toThrow(new TypeError('Invalid JSON number: -01'));
      expect(() => scan('-00e1')).toThrow(new TypeError('Invalid JSON number: -00e1'));
    });
  });

  describe('value', () => {
    it('ignores leading whitespace', () => {
      expect(scan(' \r\n\t 13')).toEqual(['13']);
    });
    it('fails on unrecognized input', () => {
      expect(() => scan(' \u0001')).toThrow(new TypeError('JSON value expected'));
    });
    it('fails on empty string', () => {
      expect(() => scan('')).toThrow(new TypeError('Unexpected end of JSON input'));
    });
    it('fails on whitespace-only string', () => {
      expect(() => scan('   \r\n')).toThrow(new TypeError('Unexpected end of JSON input'));
    });
  });

  function scan(...input: string[]): UcToken[] {
    return scanUcTokens(emit => new UcJSONLexer(emit), ...input);
  }
});
