import { parseUcValue } from '#churi/uc-value/deserializer.js';
import { describe, expect, it } from '@jest/globals';
import { UcEntity } from '../entity/uc-entity.js';

describe('parseUcValue', () => {
  describe('string value', () => {
    it('recognized as top-level value', () => {
      expect(parseUcValue('Hello!%20World!')).toBe('Hello! World!');
    });
    it('recognized as map entry value', () => {
      expect(parseUcValue('foo(bar)')).toEqual({ foo: 'bar' });
    });
    it('recognized when prefixed with "-"', () => {
      expect(parseUcValue('foo(-bar)')).toEqual({ foo: '-bar' });
    });
    it('recognizes when percent-encoded', () => {
      expect(parseUcValue('foo(%27bar%27)')).toEqual({ foo: "'bar'" });
    });
  });

  describe('quoted string value', () => {
    it('recognized as top-level value', () => {
      expect(parseUcValue("'foo")).toBe('foo');
    });
    it('recognized as map entry value', () => {
      expect(parseUcValue("foo('bar)")).toEqual({ foo: 'bar' });
    });
    it('recognized as list item value', () => {
      expect(parseUcValue(",'bar")).toEqual(['bar']);
    });
    it('includes balanced parenthesis', () => {
      expect(parseUcValue("'foo(bar,baz)suffix")).toBe('foo(bar,baz)suffix');
    });
    it('does not close hanging parentheses', () => {
      expect(parseUcValue("'foo(bar(")).toBe('foo(bar(');
    });
  });

  describe('empty string value', () => {
    it('recognized as top-level value', () => {
      expect(parseUcValue('')).toBe('');
    });
    it('recognized as map entry value', () => {
      expect(parseUcValue('foo()')).toEqual({ foo: '' });
    });
  });

  describe('empty quoted string value', () => {
    it('recognized as top-level value', () => {
      expect(parseUcValue("'")).toBe('');
    });
    it('recognized as map entry value', () => {
      expect(parseUcValue("foo(')")).toEqual({ foo: '' });
    });
    it('recognizes as list item value', () => {
      expect(parseUcValue("',")).toEqual(['']);
      expect(parseUcValue(",'")).toEqual(['']);
      expect(parseUcValue(",',")).toEqual(['']);
    });
  });

  describe('bigint value', () => {
    it('recognized as top-level value', () => {
      expect(parseUcValue('0n13')).toBe(13n);
      expect(parseUcValue('-0n13')).toBe(-13n);
      expect(parseUcValue('0n')).toBe(0n);
      expect(parseUcValue('-0n')).toBe(0n);
    });
    it('recognized as map entry value', () => {
      expect(parseUcValue('foo(0n13)')).toEqual({ foo: 13n });
      expect(parseUcValue('foo(-0n13)')).toEqual({ foo: -13n });
      expect(parseUcValue('foo(0n)')).toEqual({ foo: 0n });
      expect(parseUcValue('foo(-0n)')).toEqual({ foo: 0n });
    });
    it('recognized as list item value', () => {
      expect(parseUcValue(',0n13,')).toEqual([13n]);
      expect(parseUcValue(',-0n13,')).toEqual([-13n]);
      expect(parseUcValue(',0n,')).toEqual([0n]);
      expect(parseUcValue(',-0n,')).toEqual([0n]);
    });
  });

  describe('boolean value', () => {
    it('recognized as top-level value', () => {
      expect(parseUcValue('!')).toBe(true);
      expect(parseUcValue('-')).toBe(false);
    });
    it('recognized as map entry value', () => {
      expect(parseUcValue('foo(!)')).toEqual({ foo: true });
      expect(parseUcValue('foo(-)')).toEqual({ foo: false });
    });
    it('recognized as list item value', () => {
      expect(parseUcValue(',!')).toEqual([true]);
      expect(parseUcValue('!,')).toEqual([true]);
      expect(parseUcValue(',!,')).toEqual([true]);
      expect(parseUcValue(',-')).toEqual([false]);
      expect(parseUcValue('-,')).toEqual([false]);
      expect(parseUcValue(',-,')).toEqual([false]);
    });
  });

  describe('empty map', () => {
    it('recognized as top-level value', () => {
      expect(parseUcValue('$')).toEqual({});
    });
    it('recognized as map entry value', () => {
      expect(parseUcValue('foo($)')).toEqual({ foo: {} });
    });
    it('recognized as list item value', () => {
      expect(parseUcValue(',$')).toEqual([{}]);
    });
  });

  describe('empty list', () => {
    it('recognized as top-level value', () => {
      expect(parseUcValue(',')).toEqual([]);
    });
    it('recognized as map entry value', () => {
      expect(parseUcValue('foo(,)')).toEqual({ foo: [] });
    });
    it('recognized as nested list item value', () => {
      expect(parseUcValue('()')).toEqual([[]]);
      expect(parseUcValue('(,)')).toEqual([[]]);
    });
  });

  describe('empty list item', () => {
    it('recognized as top-level value', () => {
      expect(parseUcValue(',,')).toEqual(['']);
    });
    it('recognized as map entry value', () => {
      expect(parseUcValue('foo(,,)')).toEqual({ foo: [''] });
    });
    it('recognized as nested list item value', () => {
      expect(parseUcValue('(,,)')).toEqual([['']]);
    });
  });

  describe('null value', () => {
    it('recognized as top-level value', () => {
      expect(parseUcValue('--')).toBeNull();
    });
    it('recognized as map entry value', () => {
      expect(parseUcValue('foo(--)')).toEqual({ foo: null });
    });
    it('recognized as list item value', () => {
      expect(parseUcValue(',--')).toEqual([null]);
      expect(parseUcValue('--,')).toEqual([null]);
    });
  });

  describe('decimal number value', () => {
    it('recognized as top-level value', () => {
      expect(parseUcValue('123E-2')).toBe(123e-2);
      expect(parseUcValue('%3123E-2')).toBe(123e-2);
      expect(parseUcValue('%3123E-2')).toBe(123e-2);
      expect(parseUcValue('-123E-2')).toBe(-123e-2);
      expect(parseUcValue('-%3123E-2')).toBe(-123e-2);
      expect(parseUcValue('%2D123E-2')).toBe(-123e-2);
      expect(parseUcValue('0')).toBe(0);
      expect(parseUcValue('-0')).toBe(-0);
    });
    it('recognized as map entry value', () => {
      expect(parseUcValue('foo(123E-2)')).toEqual({ foo: 123e-2 });
      expect(parseUcValue('foo(%3123E-2)')).toEqual({ foo: 123e-2 });
      expect(parseUcValue('foo(-123E-2)')).toEqual({ foo: -123e-2 });
      expect(parseUcValue('foo(%2D123E-2)')).toEqual({ foo: -123e-2 });
      expect(parseUcValue('foo(0)')).toEqual({ foo: 0 });
      expect(parseUcValue('foo(-0)')).toEqual({ foo: -0 });
    });
    it('recognized as list item value', () => {
      expect(parseUcValue(',123E-2')).toEqual([123e-2]);
      expect(parseUcValue(',%3123E-2)')).toEqual([123e-2]);
      expect(parseUcValue(',-123E-2')).toEqual([-123e-2]);
      expect(parseUcValue(',%2D123E-2')).toEqual([-123e-2]);
      expect(parseUcValue(',0')).toEqual([0]);
      expect(parseUcValue(',-0)')).toEqual([-0]);
    });
  });

  describe('binary number value', () => {
    it('recognized as map entry value', () => {
      expect(parseUcValue('foo(0b1101)')).toEqual({ foo: 0b1101 });
      expect(parseUcValue('foo(-0b1101)')).toEqual({ foo: -0b1101 });
      expect(parseUcValue('foo(0b)')).toEqual({ foo: 0 });
      expect(parseUcValue('foo(-0b)')).toEqual({ foo: -0 });
    });
  });

  describe('hexadecimal number value', () => {
    it('recognized as map entry value', () => {
      expect(parseUcValue('foo(0x123)')).toEqual({ foo: 0x123 });
      expect(parseUcValue('foo(-0x123)')).toEqual({ foo: -0x123 });
      expect(parseUcValue('foo(0x)')).toEqual({ foo: 0 });
      expect(parseUcValue('foo(-0x)')).toEqual({ foo: -0 });
    });
  });

  describe('opaque entity', () => {
    it('recognized at top level', () => {
      expect(parseUcValue('!bar%20baz')).toEqual(new UcEntity('!bar%20baz'));
    });
    it('recognized as map entry value', () => {
      expect(parseUcValue('foo(!bar%20baz)')).toEqual({
        foo: new UcEntity('!bar%20baz'),
      });
    });
    it('recognized as list item value', () => {
      expect(parseUcValue(',!bar%20baz')).toEqual([new UcEntity('!bar%20baz')]);
      expect(parseUcValue('!bar%20baz,')).toEqual([new UcEntity('!bar%20baz')]);
      expect(parseUcValue(',!bar%20baz,')).toEqual([new UcEntity('!bar%20baz')]);
    });
    it('closes hanging parentheses', () => {
      const { raw } = parseUcValue('!foo(bar(item1,item2)baz(') as UcEntity;

      expect(raw).toBe('!foo(bar(item1,item2)baz())');
    });
  });

  describe('list value', () => {
    it('recognized as top-level value with one item', () => {
      expect(parseUcValue('123,')).toEqual([123]);
      expect(parseUcValue(',123')).toEqual([123]);
      expect(parseUcValue(',123,')).toEqual([123]);
    });
    it('recognized as top-level value', () => {
      expect(parseUcValue('123,456')).toEqual([123, 456]);
    });
    it('recognized as map entry value', () => {
      expect(parseUcValue("foo(1,bar,')")).toEqual({
        foo: [1, 'bar', ''],
      });
    });
    it('recognized as map entry value with leading empty string', () => {
      expect(parseUcValue("foo(',1)")).toEqual({
        foo: ['', 1],
      });
    });
    it('recognized as multiple nested lists', () => {
      expect(parseUcValue('foo((1)(bar)())')).toEqual({
        foo: [[1], ['bar'], []],
      });
    });
    it('recognized as single nested list', () => {
      expect(parseUcValue('foo((1))')).toEqual({
        foo: [[1]],
      });
    });
    it('recognized as single empty nested list', () => {
      expect(parseUcValue('foo(())')).toEqual({
        foo: [[]],
      });
    });
    it('recognized when deeply nested', () => {
      expect(parseUcValue('foo(((1)(bar)(!))((2)(baz)(-)))')).toEqual({
        foo: [
          [[1], ['bar'], [true]],
          [[2], ['baz'], [false]],
        ],
      });
    });
    it('ignores leading comma', () => {
      expect(parseUcValue(',(2),(baz)(-)')).toEqual([[2], ['baz'], [false]]);
      expect(parseUcValue('(,(2),(baz)(-))')).toEqual([[[2], ['baz'], [false]]]);
    });
    it('ignores trailing comma', () => {
      expect(parseUcValue('(2),(baz)(-),')).toEqual([[2], ['baz'], [false]]);
      expect(parseUcValue('((2),(baz)(-),)')).toEqual([[[2], ['baz'], [false]]]);
    });
    it('ignores both leading and trailing commas', () => {
      expect(parseUcValue(',(2),(baz)(-),')).toEqual([[2], ['baz'], [false]]);
      expect(parseUcValue('(,(2),(baz)(-),)')).toEqual([[[2], ['baz'], [false]]]);
    });
    it('ignores the only comma', () => {
      expect(parseUcValue(',')).toEqual([]);
      expect(parseUcValue('(,)')).toEqual([[]]);
      expect(parseUcValue('((,))')).toEqual([[[]]]);
    });
  });

  describe('map value', () => {
    it('recognized when nested', () => {
      expect(parseUcValue('foo(bar(baz))')).toEqual({ foo: { bar: 'baz' } });
    });
    it('recognized when deeply nested', () => {
      expect(parseUcValue('foo(bar(baz(13)))')).toEqual({ foo: { bar: { baz: 13 } } });
    });
  });

  describe('map entry', () => {
    it('recognized with percent-encoded key', () => {
      expect(parseUcValue('%27foo%27(13)')).toEqual({ "'foo'": 13 });
    });
    it('recognized with escaped key', () => {
      expect(parseUcValue('$foo$(13)')).toEqual({ foo$: 13 });
    });
    it('recognized with empty key', () => {
      expect(parseUcValue('$(13)')).toEqual({ '': 13 });
    });
    it('recognized with key only', () => {
      expect(parseUcValue('$foo')).toEqual({ foo: '' });
    });
    it('recognized after preceding one', () => {
      expect(parseUcValue('foo(1)bar(test)baz()suffix')).toEqual({
        foo: 1,
        bar: 'test',
        baz: '',
        suffix: '',
      });
    });
    it('recognized after list-valued entry', () => {
      expect(parseUcValue('foo(1,bar)test(-)')).toEqual({
        foo: [1, 'bar'],
        test: false,
      });
    });
    it('overrides previous value', () => {
      expect(parseUcValue('foo(1)foo(bar)foo')).toEqual({
        foo: '',
      });
    });
    it('treated as trailing item of top-level list', () => {
      expect(parseUcValue('123,456,foo(test)bar(1)tail')).toEqual([
        123,
        456,
        { foo: 'test', bar: 1, tail: '' },
      ]);
      expect(parseUcValue('(123)(456)foo(test)bar(1)tail')).toEqual([
        [123],
        [456],
        { foo: 'test', bar: 1, tail: '' },
      ]);
    });
    it('treated as trailing item of list-valued entry', () => {
      expect(parseUcValue('foo(bar((1)(2)test(3))))')).toEqual({
        foo: { bar: [[1], [2], { test: 3 }] },
      });
      expect(parseUcValue('foo(bar(1,2,test(3))))')).toEqual({
        foo: { bar: [1, 2, { test: 3 }] },
      });
    });
  });

  describe('suffix', () => {
    it('parsed for top-level map', () => {
      expect(parseUcValue('foo(456)suffix')).toEqual({ foo: 456, suffix: '' });
    });
    it('treated as trailing string item after nested list', () => {
      expect(parseUcValue('(123)(456)foo')).toEqual([[123], [456], 'foo']);
      expect(parseUcValue('foo(bar(1)(2)test))')).toEqual({
        foo: [{ bar: 1 }, [2], 'test'],
      });
      expect(parseUcValue('foo(bar((1)(2)test)))')).toEqual({
        foo: { bar: [[1], [2], 'test'] },
      });
    });
    it('treated as map entry containing empty string after single-valued entry', () => {
      expect(parseUcValue('foo(bar(baz)test))')).toEqual({
        foo: { bar: 'baz', test: '' },
      });
    });
  });

  it('merges maps', () => {
    expect(parseUcValue('foo(bar(baz(1)))foo(bar(baz(-)))foo(bar(baz(2)test))')).toEqual({
      foo: { bar: { baz: 2, test: '' } },
    });
  });
  it('overrides list', () => {
    expect(parseUcValue('foo(bar,baz)foo(bar1,baz1)foo(bar2,baz2)')).toEqual({
      foo: ['bar2', 'baz2'],
    });
  });
  it('replaces value with map', () => {
    expect(parseUcValue('foo(bar(test))foo(bar(baz(1)test))')).toEqual({
      foo: { bar: { baz: 1, test: '' } },
    });
  });
  it('concatenates maps', () => {
    expect(parseUcValue('foo(bar(test,test2),bar(baz(1)test(!)),bar(baz(2)test(-)))')).toEqual({
      foo: [
        { bar: ['test', 'test2'] },
        { bar: { baz: 1, test: true } },
        { bar: { baz: 2, test: false } },
      ],
    });
  });
  it('concatenates map and value', () => {
    expect(parseUcValue('foo(bar(baz(1),test))')).toEqual({
      foo: { bar: [{ baz: 1 }, 'test'] },
    });
  });
  it('stops simple value parsing at closing parent', () => {
    expect(parseUcValue('foo)')).toBe('foo');
  });
  it('stops top-level list parsing at closing parent', () => {
    expect(parseUcValue(',foo)')).toEqual(['foo']);
    expect(parseUcValue('foo,)')).toEqual(['foo']);
    expect(parseUcValue(',foo,)')).toEqual(['foo']);
  });
  it('stops nested list parsing at closing parent', () => {
    expect(parseUcValue('(foo))')).toEqual([['foo']]);
    expect(parseUcValue(',(foo))')).toEqual([['foo']]);
    expect(parseUcValue('(foo),)')).toEqual([['foo']]);
    expect(parseUcValue(',(foo),)')).toEqual([['foo']]);
  });
  it('stops nested list parsing after comma', () => {
    expect(parseUcValue('(foo,bar,')).toEqual([['foo', 'bar']]);
  });
  it('stops entries parsing at closing parent', () => {
    expect(parseUcValue('foo(bar))')).toEqual({ foo: 'bar' });
  });
  it('stops map suffix parsing at closing parent', () => {
    expect(parseUcValue('foo(bar)baz)')).toEqual({ foo: 'bar', baz: '' });
  });
  it('stops map parsing at the end of input', () => {
    expect(parseUcValue('foo(13')).toEqual({ foo: 13 });
  });
  it('stops map parsing at closing parent', () => {
    expect(parseUcValue('foo(13))')).toEqual({ foo: 13 });
  });
  it('stops entry value parsing at the end of input', () => {
    expect(parseUcValue('foo(1)bar(2)baz(13')).toEqual({ foo: 1, bar: 2, baz: 13 });
  });
  it('stops nested entry value parsing at the end of input', () => {
    expect(parseUcValue('foo(bar(baz(13')).toEqual({ foo: { bar: { baz: 13 } } });
  });
  it('stops empty entry value parsing at the end of input', () => {
    expect(parseUcValue('foo(1)bar(2)baz(')).toEqual({ foo: 1, bar: 2, baz: '' });
  });
  it('stops nested empty entry value parsing at the end of input', () => {
    expect(parseUcValue('foo(bar(baz(')).toEqual({ foo: { bar: { baz: '' } } });
  });
});
