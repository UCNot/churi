import { describe, expect, it } from '@jest/globals';
import { parseURICharge } from './parse-uri-charge.js';

describe('parseURICharge', () => {
  describe('bigint value', () => {
    it('recognized as object property', () => {
      expect(parseURICharge('foo(0n13)').charge).toEqual({ foo: 13n });
      expect(parseURICharge('foo(-0n13)').charge).toEqual({ foo: -13n });
      expect(parseURICharge('foo(0n)').charge).toEqual({ foo: 0n });
      expect(parseURICharge('foo(-0n)').charge).toEqual({ foo: 0n });
    });
    it('recognized as array element', () => {
      expect(parseURICharge('(0n13)').charge).toEqual([13n]);
      expect(parseURICharge('(-0n13)').charge).toEqual([-13n]);
      expect(parseURICharge('(0n)').charge).toEqual([0n]);
      expect(parseURICharge('(-0n)').charge).toEqual([0n]);
    });
  });

  describe('boolean value', () => {
    it('recognized as object property', () => {
      expect(parseURICharge('foo(!)').charge).toEqual({ foo: true });
      expect(parseURICharge('foo(-)').charge).toEqual({ foo: false });
    });
    it('recognized as array element', () => {
      expect(parseURICharge('(!)').charge).toEqual([true]);
      expect(parseURICharge('(-)').charge).toEqual([false]);
    });
  });

  describe('empty object value', () => {
    it('recognized as top-level value', () => {
      expect(parseURICharge('')).toEqual({ charge: {}, end: 0 });
    });
    it('recognized as object property', () => {
      expect(parseURICharge('foo()').charge).toEqual({ foo: {} });
    });
    it('recognized as array element', () => {
      expect(parseURICharge('()').charge).toEqual([{}]);
    });
  });

  describe('empty array value', () => {
    it('recognized as top-level value', () => {
      expect(parseURICharge('--')).toEqual({ charge: [], end: 2 });
    });
    it('recognized as object property', () => {
      expect(parseURICharge('foo(--)').charge).toEqual({ foo: [] });
    });
    it('recognized as array element', () => {
      expect(parseURICharge('(--)').charge).toEqual([[]]);
    });
  });

  describe('decimal number value', () => {
    it('recognized as top-level value', () => {
      expect(parseURICharge('123E-2')).toEqual({ charge: 123e-2, end: 6 });
      expect(parseURICharge('-123E-2')).toEqual({ charge: -123e-2, end: 7 });
      expect(parseURICharge('0')).toEqual({ charge: 0, end: 1 });
      expect(parseURICharge('-0')).toEqual({ charge: -0, end: 2 });
    });
    it('recognized as object property', () => {
      expect(parseURICharge('foo(123E-2)').charge).toEqual({ foo: 123e-2 });
      expect(parseURICharge('foo(-123E-2)').charge).toEqual({ foo: -123e-2 });
      expect(parseURICharge('foo(0)').charge).toEqual({ foo: 0 });
      expect(parseURICharge('foo(-0)').charge).toEqual({ foo: -0 });
    });
    it('recognized as array element', () => {
      expect(parseURICharge('(123E-2)').charge).toEqual([123e-2]);
      expect(parseURICharge('(-123E-2)').charge).toEqual([-123e-2]);
      expect(parseURICharge('(0)').charge).toEqual([0]);
      expect(parseURICharge('(-0)').charge).toEqual([-0]);
    });
  });

  describe('binary number value', () => {
    it('recognized as object property', () => {
      expect(parseURICharge('foo(0b1101)').charge).toEqual({ foo: 0b1101 });
      expect(parseURICharge('foo(-0b1101)').charge).toEqual({ foo: -0b1101 });
      expect(parseURICharge('foo(0b)').charge).toEqual({ foo: 0 });
      expect(parseURICharge('foo(-0b)').charge).toEqual({ foo: -0 });
    });
  });

  describe('hexadecimal number value', () => {
    it('recognized as object property', () => {
      expect(parseURICharge('foo(0x123)').charge).toEqual({ foo: 0x123 });
      expect(parseURICharge('foo(-0x123)').charge).toEqual({ foo: -0x123 });
      expect(parseURICharge('foo(0x)').charge).toEqual({ foo: 0 });
      expect(parseURICharge('foo(-0x)').charge).toEqual({ foo: -0 });
    });
  });

  describe('string value', () => {
    it('recognized as top-level value', () => {
      expect(parseURICharge('Hello,%20World!')).toEqual({ charge: 'Hello, World!', end: 15 });
    });
    it('recognized as object property', () => {
      expect(parseURICharge('foo(bar)').charge).toEqual({ foo: 'bar' });
    });
    it('recognized when prefixed with "-"', () => {
      expect(parseURICharge('foo(-bar)').charge).toEqual({ foo: '-bar' });
    });
    it('recognizes when percent-encoded', () => {
      expect(parseURICharge('foo(%27bar%27)').charge).toEqual({ foo: "'bar'" });
    });
  });

  describe('unknown entity', () => {
    it('treated as string at top level', () => {
      expect(parseURICharge('!bar%20baz').charge).toBe('!bar baz');
    });
    it('treated as string within object property', () => {
      expect(parseURICharge('foo(!bar%20baz)').charge).toEqual({ foo: '!bar baz' });
    });
    it('treated as string within array element', () => {
      expect(parseURICharge('(!bar%20baz)').charge).toEqual(['!bar baz']);
    });
  });

  describe('quoted string', () => {
    it('recognized as top-level value', () => {
      expect(parseURICharge("'foo")).toEqual({
        charge: 'foo',
        end: 4,
      });
    });
    it('recognized as object property', () => {
      expect(parseURICharge("foo('bar)").charge).toEqual({ foo: 'bar' });
    });
    it('recognized as array element', () => {
      expect(parseURICharge("('bar)").charge).toEqual(['bar']);
    });
  });

  describe('empty quoted string value', () => {
    it('recognized as top-level value', () => {
      expect(parseURICharge("'")).toEqual({
        charge: '',
        end: 1,
      });
    });
    it('recognized as object property', () => {
      expect(parseURICharge("foo(')").charge).toEqual({ foo: '' });
    });
    it('recognizes as array element', () => {
      expect(parseURICharge("(')").charge).toEqual(['']);
    });
  });

  describe('array value', () => {
    it('recognized as top-level value with one element', () => {
      expect(parseURICharge('(123)').charge).toEqual([123]);
    });
    it('recognized as top-level value', () => {
      expect(parseURICharge('(123)(456)').charge).toEqual([123, 456]);
    });
    it('recognized as object property', () => {
      expect(parseURICharge('foo(1)(bar)()').charge).toEqual({
        foo: [1, 'bar', {}],
      });
    });
    it('recognized as object property with leading empty object', () => {
      expect(parseURICharge('foo()(1)').charge).toEqual({
        foo: [{}, 1],
      });
    });
    it('recognized with multiple elements', () => {
      expect(parseURICharge('foo((1)(bar)())').charge).toEqual({
        foo: [1, 'bar', {}],
      });
    });
    it('recognized with single element', () => {
      expect(parseURICharge('foo((1))').charge).toEqual({
        foo: [1],
      });
    });
    it('recognized with single empty object element', () => {
      expect(parseURICharge('foo(())').charge).toEqual({
        foo: [{}],
      });
    });
    it('recognized when nested', () => {
      expect(parseURICharge('foo(((1)(bar)(!))((2)(baz)(-)))').charge).toEqual({
        foo: [
          [1, 'bar', true],
          [2, 'baz', false],
        ],
      });
    });
  });

  describe('object value', () => {
    it('recognized when nested', () => {
      expect(parseURICharge('foo(bar(baz))').charge).toEqual({ foo: { bar: 'baz' } });
    });
    it('recognized when deeply nested', () => {
      expect(parseURICharge('foo(bar(baz(13)))').charge).toEqual({ foo: { bar: { baz: 13 } } });
    });
  });

  describe('object property', () => {
    it('recognized with percent-encoded property name', () => {
      expect(parseURICharge('%27foo%27(13)').charge).toEqual({ "'foo'": 13 });
    });
    it('recognized with quoted name', () => {
      expect(parseURICharge("'foo'(13)").charge).toEqual({ "foo'": 13 });
    });
    it('recognized with empty name', () => {
      expect(parseURICharge("'(13)").charge).toEqual({ '': 13 });
    });
    it('recognized after preceding one', () => {
      expect(parseURICharge('foo(1)bar(test)baz()suffix').charge).toEqual({
        foo: 1,
        bar: 'test',
        baz: {},
        suffix: {},
      });
    });
    it('recognized after array property', () => {
      expect(parseURICharge('foo(1)(bar)test(-)').charge).toEqual({
        foo: [1, 'bar'],
        test: false,
      });
    });
    it('overrides previous value', () => {
      expect(parseURICharge('foo(1)foo(bar)foo').charge).toEqual({
        foo: {},
      });
    });
    it('treated as trailing object of top-level array', () => {
      expect(parseURICharge('(123)(456)foo(test)bar(1)tail').charge).toEqual([
        123,
        456,
        { foo: 'test', bar: 1, tail: {} },
      ]);
    });
    it('treated as trailing object after array value', () => {
      expect(parseURICharge('foo(bar((1)(2)test(3))))').charge).toEqual({
        foo: { bar: [1, 2, { test: 3 }] },
      });
    });
  });

  describe('object suffix', () => {
    it('treated as trailing object element of top-level array', () => {
      expect(parseURICharge('(123)(456)foo').charge).toEqual([123, 456, { foo: {} }]);
    });
    it('treated as object property after another property', () => {
      expect(parseURICharge('foo(bar(baz)test))').charge).toEqual({
        foo: { bar: 'baz', test: {} },
      });
    });
    it('treated as object property after array property', () => {
      expect(parseURICharge('foo(bar(1)(2)test))').charge).toEqual({
        foo: { bar: [1, 2], test: {} },
      });
    });
    it('treated as trailing object property after array value', () => {
      expect(parseURICharge('foo(bar((1)(2)test)))').charge).toEqual({
        foo: { bar: [1, 2, { test: {} }] },
      });
    });
  });

  describe('unknown directive', () => {
    it('treated as top-level object', () => {
      expect(parseURICharge('!bar%20baz(foo)((1))test').charge).toEqual({
        '!bar baz': ['foo', [1], { test: {} }],
      });
    });
    it('treated as object within object property', () => {
      expect(parseURICharge('foo(!bar%20baz())').charge).toEqual({ foo: { '!bar baz': [{}] } });
    });
    it('treated as object within array element', () => {
      expect(parseURICharge('(!bar%20baz())').charge).toEqual([{ '!bar baz': [{}] }]);
    });
  });

  it('merges objects', () => {
    expect(parseURICharge('foo(bar(baz(1)))foo(bar(baz(-)))foo(bar(baz(2)test))').charge).toEqual({
      foo: { bar: { baz: 2, test: {} } },
    });
  });
  it('concatenates array values', () => {
    expect(parseURICharge('foo(bar)(baz)foo((bar1)(baz1))foo((bar2)(baz2))').charge).toEqual({
      foo: ['bar', 'baz', 'bar1', 'baz1', 'bar2', 'baz2'],
    });
  });
  it('overrides arrays', () => {
    expect(parseURICharge('foo(bar)(baz)foo(bar1)(baz1)foo(bar2)(baz2)').charge).toEqual({
      foo: ['bar2', 'baz2'],
    });
  });
  it('replaces value with object', () => {
    expect(parseURICharge('foo(bar(test))foo(bar(baz(1)test))').charge).toEqual({
      foo: { bar: { baz: 1, test: {} } },
    });
  });
  it('concatenates objects', () => {
    expect(
      parseURICharge('foo(bar(test)(test2))(bar(baz(1)test(!)))(bar(baz(2)test(-)))').charge,
    ).toEqual({
      foo: [
        { bar: ['test', 'test2'] },
        { bar: { baz: 1, test: true } },
        { bar: { baz: 2, test: false } },
      ],
    });
  });
  it('concatenates object and value', () => {
    expect(parseURICharge('foo(bar(baz(1))(test))').charge).toEqual({
      foo: { bar: [{ baz: 1 }, 'test'] },
    });
  });
  it('stops simple value parsing at closing parent', () => {
    expect(parseURICharge('foo)')).toEqual({ charge: 'foo', end: 3 });
  });
  it('stops top-level array parsing at closing parent', () => {
    expect(parseURICharge('(foo))')).toEqual({ charge: ['foo'], end: 5 });
  });
  it('stops properties parsing at closing parent', () => {
    expect(parseURICharge('foo(bar))')).toEqual({ charge: { foo: 'bar' }, end: 8 });
  });
  it('stops object suffix parsing at closing parent', () => {
    expect(parseURICharge('foo(bar)baz)')).toEqual({ charge: { foo: 'bar', baz: {} }, end: 11 });
  });
  it('stops object parsing at the end of input', () => {
    expect(parseURICharge('foo(13')).toEqual({
      charge: { foo: 13 },
      end: 6,
    });
  });
  it('stops object parsing at closing parent', () => {
    expect(parseURICharge('foo(13))')).toEqual({
      charge: { foo: 13 },
      end: 7,
    });
  });
  it('stops property value parsing at the end of input', () => {
    expect(parseURICharge('foo(1)bar(2)baz(13')).toEqual({
      charge: { foo: 1, bar: 2, baz: 13 },
      end: 18,
    });
  });
  it('stops nested property value parsing at the end of input', () => {
    expect(parseURICharge('foo(bar(baz(13')).toEqual({
      charge: { foo: { bar: { baz: 13 } } },
      end: 14,
    });
  });
  it('stops empty property value parsing at the end of input', () => {
    expect(parseURICharge('foo(1)bar(2)baz(')).toEqual({
      charge: { foo: 1, bar: 2, baz: {} },
      end: 16,
    });
  });
  it('stops nested empty property value parsing at the end of input', () => {
    expect(parseURICharge('foo(bar(baz(')).toEqual({
      charge: { foo: { bar: { baz: {} } } },
      end: 12,
    });
  });
});
