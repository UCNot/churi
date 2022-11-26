import { describe, expect, it } from '@jest/globals';
import { parseURICharge } from './parse-uri-charge.js';

describe('parseURICharge', () => {
  it('recognizes top-level string', () => {
    expect(parseURICharge('Hello,%20World!').charge).toBe('Hello, World!');
  });
  it('recognizes top-level quoted string', () => {
    expect(parseURICharge("'foo")).toEqual({
      charge: 'foo',
      end: 4,
    });
  });
  it('recognizes top-level empty string', () => {
    expect(parseURICharge('')).toEqual({
      charge: '',
      end: 0,
    });
  });
  it('recognizes top-level quoted empty string', () => {
    expect(parseURICharge("'")).toEqual({
      charge: '',
      end: 1,
    });
  });
  it('recognizes top-level number', () => {
    expect(parseURICharge('123').charge).toBe(123);
  });
  it('recognizes top-level array with one element', () => {
    expect(parseURICharge('(123)').charge).toEqual([123]);
  });
  it('recognizes top-level array with multiple elements', () => {
    expect(parseURICharge('(123)(456)').charge).toEqual([123, 456]);
  });
  it('recognizes trailing object of top-level array', () => {
    expect(parseURICharge('(123)(456)foo(test)bar(1)tail').charge).toEqual([
      123,
      456,
      { foo: 'test', bar: 1, tail: {} },
    ]);
  });
  it('treats top-level array suffix as trailing object element', () => {
    expect(parseURICharge('(123)(456)foo').charge).toEqual([123, 456, { foo: {} }]);
  });
  it('recognizes bigint property', () => {
    expect(parseURICharge('foo(0n13)').charge).toEqual({ foo: 13n });
    expect(parseURICharge('foo(-0n13)').charge).toEqual({ foo: -13n });
    expect(parseURICharge('foo(0n)').charge).toEqual({ foo: 0n });
    expect(parseURICharge('foo(-0n)').charge).toEqual({ foo: 0n });
  });
  it('recognizes bigint element', () => {
    expect(parseURICharge('(0n13)').charge).toEqual([13n]);
    expect(parseURICharge('(-0n13)').charge).toEqual([-13n]);
    expect(parseURICharge('(0n)').charge).toEqual([0n]);
    expect(parseURICharge('(-0n)').charge).toEqual([0n]);
  });
  it('recognizes boolean property', () => {
    expect(parseURICharge('foo(!)').charge).toEqual({ foo: true });
    expect(parseURICharge('foo(-)').charge).toEqual({ foo: false });
  });
  it('recognizes boolean element', () => {
    expect(parseURICharge('(!)').charge).toEqual([true]);
    expect(parseURICharge('(-)').charge).toEqual([false]);
  });
  it('recognizes empty object property', () => {
    expect(parseURICharge('foo()').charge).toEqual({ foo: {} });
  });
  it('recognizes empty object element', () => {
    expect(parseURICharge('()').charge).toEqual([{}]);
  });
  it('recognizes empty array property', () => {
    expect(parseURICharge('foo(--)').charge).toEqual({ foo: [] });
  });
  it('recognizes empty array element', () => {
    expect(parseURICharge('(--)').charge).toEqual([[]]);
  });
  it('recognizes number property', () => {
    expect(parseURICharge('foo(123E-2)').charge).toEqual({ foo: 123e-2 });
    expect(parseURICharge('foo(-123E-2)').charge).toEqual({ foo: -123e-2 });
    expect(parseURICharge('foo(0)').charge).toEqual({ foo: 0 });
    expect(parseURICharge('foo(-0)').charge).toEqual({ foo: -0 });
  });
  it('recognizes number element', () => {
    expect(parseURICharge('(123E-2)').charge).toEqual([123e-2]);
    expect(parseURICharge('(-123E-2)').charge).toEqual([-123e-2]);
    expect(parseURICharge('(0)').charge).toEqual([0]);
    expect(parseURICharge('(-0)').charge).toEqual([-0]);
  });
  it('recognizes binary number property', () => {
    expect(parseURICharge('foo(0b1101)').charge).toEqual({ foo: 0b1101 });
    expect(parseURICharge('foo(-0b1101)').charge).toEqual({ foo: -0b1101 });
    expect(parseURICharge('foo(0b)').charge).toEqual({ foo: 0 });
    expect(parseURICharge('foo(-0b)').charge).toEqual({ foo: -0 });
  });
  it('recognizes hexadecimal number property', () => {
    expect(parseURICharge('foo(0x123)').charge).toEqual({ foo: 0x123 });
    expect(parseURICharge('foo(-0x123)').charge).toEqual({ foo: -0x123 });
    expect(parseURICharge('foo(0x)').charge).toEqual({ foo: 0 });
    expect(parseURICharge('foo(-0x)').charge).toEqual({ foo: -0 });
  });
  it('recognizes string property', () => {
    expect(parseURICharge('foo(bar)').charge).toEqual({ foo: 'bar' });
  });
  it('recognizes quoted string property', () => {
    expect(parseURICharge("foo('bar)").charge).toEqual({ foo: 'bar' });
  });
  it('recognizes quoted string element', () => {
    expect(parseURICharge("('bar)").charge).toEqual(['bar']);
  });
  it('recognizes empty string property', () => {
    expect(parseURICharge("foo(')").charge).toEqual({ foo: '' });
  });
  it('recognizes empty string element', () => {
    expect(parseURICharge("(')").charge).toEqual(['']);
  });
  it('recognizes string property prefixed with "-"', () => {
    expect(parseURICharge('foo(-bar)').charge).toEqual({ foo: '-bar' });
  });
  it('recognizes string property prefixed with "!"', () => {
    expect(parseURICharge('foo(!bar)').charge).toEqual({ foo: '!bar' });
  });
  it('recognizes percent-encoded string property', () => {
    expect(parseURICharge('foo(%27bar%27)').charge).toEqual({ foo: "'bar'" });
  });
  it('recognizes percent-encoded property name', () => {
    expect(parseURICharge('%27foo%27(13)').charge).toEqual({ "'foo'": 13 });
  });
  it('recognizes nested object', () => {
    expect(parseURICharge('foo(bar(baz))').charge).toEqual({ foo: { bar: 'baz' } });
  });
  it('recognizes deeply nested object', () => {
    expect(parseURICharge('foo(bar(baz(13)))').charge).toEqual({ foo: { bar: { baz: 13 } } });
  });
  it('recognizes multiple properties', () => {
    expect(parseURICharge('foo(1)bar(test)baz()suffix').charge).toEqual({
      foo: 1,
      bar: 'test',
      baz: {},
      suffix: {},
    });
  });
  it('recognizes array property', () => {
    expect(parseURICharge('foo(1)(bar)()').charge).toEqual({
      foo: [1, 'bar', {}],
    });
  });
  it('recognizes array property with leading empty object', () => {
    expect(parseURICharge('foo()(1)').charge).toEqual({
      foo: [{}, 1],
    });
  });
  it('recognizes array value', () => {
    expect(parseURICharge('foo((1)(bar)())').charge).toEqual({
      foo: [1, 'bar', {}],
    });
  });
  it('recognizes array value with single element', () => {
    expect(parseURICharge('foo((1))').charge).toEqual({
      foo: [1],
    });
  });
  it('recognizes array value with single empty object element', () => {
    expect(parseURICharge('foo(())').charge).toEqual({
      foo: [{}],
    });
  });
  it('recognizes nested array property', () => {
    expect(parseURICharge('foo(((1)(bar)(!))((2)(baz)(-)))').charge).toEqual({
      foo: [
        [1, 'bar', true],
        [2, 'baz', false],
      ],
    });
  });
  it('recognizes property after array', () => {
    expect(parseURICharge('foo(1)(bar)test(-)').charge).toEqual({
      foo: [1, 'bar'],
      test: false,
    });
  });
  it('overrides property value', () => {
    expect(parseURICharge('foo(1)foo(bar)foo').charge).toEqual({
      foo: {},
    });
  });
  it('treats suffix as object property', () => {
    expect(parseURICharge('foo(bar(baz)test))').charge).toEqual({
      foo: { bar: 'baz', test: {} },
    });
  });
  it('treats suffix after array as object property', () => {
    expect(parseURICharge('foo(bar(1)(2)test))').charge).toEqual({
      foo: { bar: [1, 2], test: {} },
    });
  });
  it('treats suffix after array value as trailing object', () => {
    expect(parseURICharge('foo(bar((1)(2)test)))').charge).toEqual({
      foo: { bar: [1, 2, { test: {} }] },
    });
  });
  it('treats property after array value as trailing object', () => {
    expect(parseURICharge('foo(bar((1)(2)test(3))))').charge).toEqual({
      foo: { bar: [1, 2, { test: 3 }] },
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
