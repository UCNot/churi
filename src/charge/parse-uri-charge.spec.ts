import { describe, expect, it } from '@jest/globals';
import { parseURICharge } from './parse-uri-charge.js';

describe('parseURICharge', () => {
  it('recognizes simple string', () => {
    expect(parseURICharge('Hello,%20World!').charge).toBe('Hello, World!');
  });
  it('recognizes simple number as string', () => {
    expect(parseURICharge('123').charge).toBe('123');
  });
  it('recognizes bigint property', () => {
    expect(parseURICharge('foo(0n13)').charge).toEqual({ foo: 13n });
    expect(parseURICharge('foo(-0n13)').charge).toEqual({ foo: -13n });
    expect(parseURICharge('foo(0n)').charge).toEqual({ foo: 0n });
    expect(parseURICharge('foo(-0n)').charge).toEqual({ foo: 0n });
  });
  it('recognizes boolean property', () => {
    expect(parseURICharge('foo()').charge).toEqual({ foo: true });
    expect(parseURICharge('foo(-)').charge).toEqual({ foo: false });
  });
  it('recognizes number property', () => {
    expect(parseURICharge('foo(123E-2)').charge).toEqual({ foo: 123e-2 });
    expect(parseURICharge('foo(-123E-2)').charge).toEqual({ foo: -123e-2 });
    expect(parseURICharge('foo(0)').charge).toEqual({ foo: 0 });
    expect(parseURICharge('foo(-0)').charge).toEqual({ foo: -0 });
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
  it('recognizes empty string property', () => {
    expect(parseURICharge("foo(')").charge).toEqual({ foo: '' });
  });
  it('recognizes string property prefixed with "-"', () => {
    expect(parseURICharge('foo(-bar)').charge).toEqual({ foo: '-bar' });
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
      baz: true,
      suffix: true,
    });
  });
  it('recognizes multiple property values', () => {
    expect(parseURICharge('foo(1)(bar)()').charge).toEqual({
      foo: [1, 'bar', true],
    });
  });
  it('concatenates multiple property values', () => {
    expect(parseURICharge('foo(1)foo(bar)foo').charge).toEqual({
      foo: [1, 'bar', true],
    });
  });
  it('merges multiple objects', () => {
    expect(parseURICharge("foo(bar(baz(1)))foo(bar(baz(')))foo(bar(baz()))").charge).toEqual({
      foo: { bar: { baz: [1, '', true] } },
    });
  });
  it('concatenates value and object', () => {
    expect(parseURICharge('foo(bar(test))(bar(baz(1)test))').charge).toEqual({
      foo: { bar: ['test', { baz: 1, test: true }] },
    });
  });
  it('concatenates multiple values and object', () => {
    expect(parseURICharge('foo(bar(test)(test2))(bar(baz(1)test()))').charge).toEqual({
      foo: { bar: ['test', 'test2', { baz: 1, test: true }] },
    });
  });
  it('concatenates object and value', () => {
    expect(parseURICharge('foo(bar(baz(1)))foo(bar(test))').charge).toEqual({
      foo: { bar: [{ baz: 1 }, 'test'] },
    });
  });
  it('merges trailing objects', () => {
    expect(parseURICharge('foo(bar(1))(bar(baz(1)))(bar(baz(2)test(-)))').charge).toEqual({
      foo: { bar: [1, { baz: [1, 2], test: false }] },
    });
  });
  it('stops simple value parsing at closing parent', () => {
    expect(parseURICharge('foo)')).toEqual({ charge: 'foo', end: 3 });
  });
  it('stops properties parsing at closing parent', () => {
    expect(parseURICharge('foo(bar))')).toEqual({ charge: { foo: 'bar' }, end: 8 });
  });
  it('stops object suffix parsing at closing parent', () => {
    expect(parseURICharge('foo(bar)baz)')).toEqual({ charge: { foo: 'bar', baz: true }, end: 11 });
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
      charge: { foo: 1, bar: 2, baz: true },
      end: 16,
    });
  });
  it('stops nested empty property value parsing at the end of input', () => {
    expect(parseURICharge('foo(bar(baz(')).toEqual({
      charge: { foo: { bar: { baz: true } } },
      end: 12,
    });
  });
});
