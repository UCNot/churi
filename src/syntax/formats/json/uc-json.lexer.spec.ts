import { describe, expect, it } from '@jest/globals';
import { UC_TOKEN_APOSTROPHE, printUcTokens } from 'churi';
import { scanUcTokens } from '../../scan-uc-tokens.js';
import { UC_TOKEN_COMMA, UC_TOKEN_EXCLAMATION_MARK, UcToken } from '../../uc-token.js';
import { UcJSONLexer } from './uc-json.lexer.js';

describe('UcJSONLexer', () => {
  describe('number', () => {
    it('recognizes integer', () => {
      expect(scan('1')).toEqual(['1']);
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
      expect(scan('"foo"')).toEqual([UC_TOKEN_APOSTROPHE, 'foo']);
      expect(scan('"foo', 'bar"')).toEqual([UC_TOKEN_APOSTROPHE, 'foobar']);
      expect(scan('"foo', '-bar', '-baz', '"')).toEqual([UC_TOKEN_APOSTROPHE, 'foo-bar-baz']);
    });
    it('recognizes empty string', () => {
      expect(scan('""')).toEqual([UC_TOKEN_APOSTROPHE]);
    });
    it('recognizes escaped quote', () => {
      expect(scan('"\\"foo\\""')).toEqual([UC_TOKEN_APOSTROPHE, '"foo"']);
      expect(scan('"\\', '"foo\\""')).toEqual([UC_TOKEN_APOSTROPHE, '"foo"']);
      expect(scan('"\\', '"fo', 'o\\"', '"')).toEqual([UC_TOKEN_APOSTROPHE, '"foo"']);
    });
    it('recognizes multiple backslashes', () => {
      expect(scan('"\\\\', '\\""')).toEqual([UC_TOKEN_APOSTROPHE, '\\"']);
      expect(scan('"\\\\', 'ab\\""')).toEqual([UC_TOKEN_APOSTROPHE, '\\ab"']);
      expect(scan('"\\\\', 'ab\\', '""')).toEqual([UC_TOKEN_APOSTROPHE, '\\ab"']);
    });
    it('escapes special chars', () => {
      expect(scan('"123"')).toEqual([UC_TOKEN_APOSTROPHE, '123']);
      expect(scan('"-1"')).toEqual([UC_TOKEN_APOSTROPHE, '-1']);
      expect(scan('"-"')).toEqual([UC_TOKEN_APOSTROPHE, '-']);
      expect(scan('"--"')).toEqual([UC_TOKEN_APOSTROPHE, '--']);
      expect(scan('"-a"')).toEqual([UC_TOKEN_APOSTROPHE, '-a']);
      expect(scan('"3d"')).toEqual([UC_TOKEN_APOSTROPHE, '3d']);
    });
    it('fails on trailing input', () => {
      expect(() => scan('"foo" bar')).toThrow(new SyntaxError('Excessive input after JSON'));
    });
  });

  describe('boolean', () => {
    it('recognizes true', () => {
      expect(scan('  true  ')).toEqual([UC_TOKEN_EXCLAMATION_MARK]);
      // expect(scan('t', 'rue')).toEqual([UC_TOKEN_EXCLAMATION_MARK]);
      // expect(scan('t', 'ru', 'e')).toEqual([UC_TOKEN_EXCLAMATION_MARK]);
    });
    it('recognizes false', () => {
      expect(scan('  false  ')).toEqual(['-']);
      expect(scan('fa', 'lse')).toEqual(['-']);
      expect(scan('f', 'al', 'se')).toEqual(['-']);
    });
    it('fails on invalid value', () => {
      expect(() => scan('tRUE')).toThrow(new SyntaxError('Unrecognized JSON value: tRUE'));
      expect(() => scan('fa', 'L', 'se  ')).toThrow(
        new SyntaxError('Unrecognized JSON value: faLse'),
      );
    });
  });

  describe('null', () => {
    it('recognizes null', () => {
      expect(scan('  null  ')).toEqual(['--']);
      expect(scan('nu', 'll')).toEqual(['--']);
      expect(scan('n', 'ul', 'l  ', '\n')).toEqual(['--']);
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

  describe('array', () => {
    it('recognizes empty array', () => {
      expect(scan('[]')).toEqual([UC_TOKEN_COMMA]);
      expect(scan(' [   ]  ')).toEqual([UC_TOKEN_COMMA]);
      expect(scan(' [ ', '  ]  ')).toEqual([UC_TOKEN_COMMA]);
    });
    it('fails on unexpected array item', () => {
      expect(() => scan('[  z ]')).toThrow(new SyntaxError('JSON value expected'));
    });
    it('fails on malformed array', () => {
      expect(() => scan('[,')).toThrow(new SyntaxError('JSON value expected'));
      expect(() => scan('[1,')).toThrow(new SyntaxError('Unexpected end of JSON input'));
      expect(() => scan('[z')).toThrow(new SyntaxError('JSON value expected'));
      expect(() => scan('[1 z')).toThrow(new SyntaxError('Malformed JSON array'));
    });
    it('recognizes single element', () => {
      expect(scan('[13]')).toEqual([UC_TOKEN_COMMA, '13']);
      expect(scan('["abc"]')).toEqual([UC_TOKEN_COMMA, UC_TOKEN_APOSTROPHE, 'abc']);
      expect(scan('[  true]')).toEqual([UC_TOKEN_COMMA, UC_TOKEN_EXCLAMATION_MARK]);
      expect(scan('[false  ]')).toEqual([UC_TOKEN_COMMA, '-']);
      expect(scan('[null]')).toEqual([UC_TOKEN_COMMA, '--']);
    });
    it('recognizes multiple elements', () => {
      expect(printUcTokens(scan('["start", 1, 2, 3, "end"]'))).toBe(`,'start,1,2,3,'end`);
    });
    it('recognizes nested array', () => {
      expect(printUcTokens(scan('[1, [], 2, [[3, [4], 5]]]'))).toBe(',1,(),2,((3,(4),5))');
    });
    it('fails on malformed nested array', () => {
      expect(() => scan('[[,')).toThrow(new SyntaxError('JSON value expected'));
      expect(() => scan('[[1,')).toThrow(new SyntaxError('Unexpected end of JSON input'));
      expect(() => scan('[[z')).toThrow(new SyntaxError('JSON value expected'));
      expect(() => scan('[[1 z')).toThrow(new SyntaxError('Malformed JSON array'));
    });
  });

  function scan(...input: string[]): UcToken[] {
    return scanUcTokens(emit => new UcJSONLexer(emit), ...input);
  }
});
