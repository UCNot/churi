import { describe, expect, it } from '@jest/globals';
import { UC_TOKEN_APOSTROPHE } from 'churi';
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
      expect(() => scan('00')).toThrow(new SyntaxError('Invalid JSON number: 00'));
      expect(() => scan('00.1')).toThrow(new SyntaxError('Invalid JSON number: 00.1'));
      expect(() => scan('-01')).toThrow(new SyntaxError('Invalid JSON number: -01'));
      expect(() => scan('-00e1')).toThrow(new SyntaxError('Invalid JSON number: -00e1'));
    });
  });

  describe('string', () => {
    it('recognizes simple string', () => {
      expect(scan('"foo"')).toEqual(['foo']);
      expect(scan('"foo', 'bar"')).toEqual(['foobar']);
      expect(scan('"foo', '-bar', '-baz', '"')).toEqual(['foo-bar-baz']);
    });
    it('recognizes escaped quote', () => {
      expect(scan('"\\"foo\\""')).toEqual(['"foo"']);
      expect(scan('"\\', '"foo\\""')).toEqual(['"foo"']);
      expect(scan('"\\', '"fo', 'o\\"', '"')).toEqual(['"foo"']);
    });
    it('recognizes multiple backslashes', () => {
      expect(scan('"\\\\', '\\""')).toEqual(['\\"']);
      expect(scan('"\\\\', 'ab\\""')).toEqual(['\\ab"']);
      expect(scan('"\\\\', 'ab\\', '""')).toEqual(['\\ab"']);
    });
    it('escapes special chars', () => {
      expect(scan('"123"')).toEqual([UC_TOKEN_APOSTROPHE, '123']);
      expect(scan('"-1"')).toEqual([UC_TOKEN_APOSTROPHE, '-1']);
      expect(scan('"-"')).toEqual([UC_TOKEN_APOSTROPHE, '-']);
      expect(scan('"--"')).toEqual([UC_TOKEN_APOSTROPHE, '--']);
      expect(scan('"-a"')).toEqual(['-a']);
      expect(scan('"3d"')).toEqual([UC_TOKEN_APOSTROPHE, '3d']);
    });
  });

  describe('value', () => {
    it('ignores leading whitespace', () => {
      expect(scan(' \r\n\t 13')).toEqual(['13']);
    });
    it('ignores trailing whitespace', () => {
      expect(scan('13\r\n')).toEqual(['13']);
    });
    it('fails on unrecognized input', () => {
      expect(() => scan(' \u0001')).toThrow(new SyntaxError('JSON value expected'));
    });
    it('fails on empty string', () => {
      expect(() => scan('')).toThrow(new SyntaxError('Unexpected end of JSON input'));
    });
    it('fails on whitespace-only string', () => {
      expect(() => scan('   \r\n')).toThrow(new SyntaxError('Unexpected end of JSON input'));
    });
  });

  function scan(...input: string[]): UcToken[] {
    return scanUcTokens(emit => new UcJSONLexer(emit), ...input);
  }
});
