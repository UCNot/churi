import { describe, expect, it } from '@jest/globals';
import { UcEntity } from '../schema/uc-entity.js';
import { UcValue } from '../schema/uc-value.js';
import { createUcValueParser, parseUcValue } from './parse-uc-value.js';
import { UcValueBuilder } from './uc-value-builder.js';
import { URIChargeParser } from './uri-charge-parser.js';

describe('createUcValueParser', () => {
  it('returns default instance without options', () => {
    expect(createUcValueParser()).toBe(createUcValueParser());
  });
  it('returns new instance with options', () => {
    expect(createUcValueParser({})).not.toBe(createUcValueParser());
  });

  describe('rxValue', () => {
    it('builds none without values', () => {
      const builder = new UcValueBuilder();
      const charge = builder.rxValue(rx => rx.end());

      expect(charge).toBe(builder.none);
    });

    it('overrides last received charge', () => {
      const charge = new UcValueBuilder().rxValue(rx => {
        rx.addValue(1, 'number');
        rx.addValue(2, 'number');

        return rx.end();
      });

      expect(charge).toBe(2);
    });
  });
});

describe('parseUcValue', () => {
  describe('string value', () => {
    it('recognized as top-level value', () => {
      expect(parse('Hello!%20World!')).toEqual({ charge: 'Hello! World!', end: 15 });
    });
    it('recognized as map entry value', () => {
      expect(parse('foo(bar)').charge).toEqual({ foo: 'bar' });
    });
    it('recognized when prefixed with "-"', () => {
      expect(parse('foo(-bar)').charge).toEqual({ foo: '-bar' });
    });
    it('recognizes when percent-encoded', () => {
      expect(parse('foo(%27bar%27)').charge).toEqual({ foo: "'bar'" });
    });
  });

  describe('quoted string value', () => {
    it('recognized as top-level value', () => {
      expect(parse("'foo")).toEqual({
        charge: 'foo',
        end: 4,
      });
    });
    it('recognized as map entry value', () => {
      expect(parse("foo('bar)").charge).toEqual({ foo: 'bar' });
    });
    it('recognized as list item value', () => {
      expect(parse(",'bar").charge).toEqual(['bar']);
    });
    it('includes balanced parenthesis', () => {
      expect(parse("'foo(bar,baz)suffix").charge).toBe('foo(bar,baz)suffix');
    });
    it('does not close hanging parentheses', () => {
      expect(parse("'foo(bar(").charge).toBe('foo(bar(');
    });
  });

  describe('empty string value', () => {
    it('recognized as top-level value', () => {
      expect(parse('')).toEqual({
        charge: '',
        end: 0,
      });
    });
    it('recognized as map entry value', () => {
      expect(parse('foo()').charge).toEqual({ foo: '' });
    });
  });

  describe('empty quoted string value', () => {
    it('recognized as top-level value', () => {
      expect(parse("'")).toEqual({
        charge: '',
        end: 1,
      });
    });
    it('recognized as map entry value', () => {
      expect(parse("foo(')").charge).toEqual({ foo: '' });
    });
    it('recognizes as list item value', () => {
      expect(parse("',").charge).toEqual(['']);
      expect(parse(",'").charge).toEqual(['']);
      expect(parse(",',").charge).toEqual(['']);
    });
  });

  describe('bigint value', () => {
    it('recognized as top-level value', () => {
      expect(parse('0n13').charge).toBe(13n);
      expect(parse('-0n13').charge).toBe(-13n);
      expect(parse('0n').charge).toBe(0n);
      expect(parse('-0n').charge).toBe(0n);
    });
    it('recognized as map entry value', () => {
      expect(parse('foo(0n13)').charge).toEqual({ foo: 13n });
      expect(parse('foo(-0n13)').charge).toEqual({ foo: -13n });
      expect(parse('foo(0n)').charge).toEqual({ foo: 0n });
      expect(parse('foo(-0n)').charge).toEqual({ foo: 0n });
    });
    it('recognized as list item value', () => {
      expect(parse(',0n13,').charge).toEqual([13n]);
      expect(parse(',-0n13,').charge).toEqual([-13n]);
      expect(parse(',0n,').charge).toEqual([0n]);
      expect(parse(',-0n,').charge).toEqual([0n]);
    });
  });

  describe('boolean value', () => {
    it('recognized as top-level value', () => {
      expect(parse('!').charge).toBe(true);
      expect(parse('-').charge).toBe(false);
    });
    it('recognized as map entry value', () => {
      expect(parse('foo(!)').charge).toEqual({ foo: true });
      expect(parse('foo(-)').charge).toEqual({ foo: false });
    });
    it('recognized as list item value', () => {
      expect(parse(',!').charge).toEqual([true]);
      expect(parse('!,').charge).toEqual([true]);
      expect(parse(',!,').charge).toEqual([true]);
      expect(parse(',-').charge).toEqual([false]);
      expect(parse('-,').charge).toEqual([false]);
      expect(parse(',-,').charge).toEqual([false]);
    });
  });

  describe('empty map', () => {
    it('recognized as top-level value', () => {
      expect(parse('$')).toEqual({ charge: {}, end: 1 });
    });
    it('recognized as map entry value', () => {
      expect(parse('foo($)').charge).toEqual({ foo: {} });
    });
    it('recognized as list item value', () => {
      expect(parse(',$').charge).toEqual([{}]);
    });
  });

  describe('empty list', () => {
    it('recognized as top-level value', () => {
      expect(parse(',')).toEqual({ charge: [], end: 1 });
    });
    it('recognized as map entry value', () => {
      expect(parse('foo(,)').charge).toEqual({ foo: [] });
    });
    it('recognized as nested list item value', () => {
      expect(parse('()')).toEqual({ charge: [[]], end: 2 });
      expect(parse('(,)')).toEqual({ charge: [[]], end: 3 });
    });
  });

  describe('empty list item', () => {
    it('recognized as top-level value', () => {
      expect(parse(',,')).toEqual({ charge: [''], end: 2 });
    });
    it('recognized as map entry value', () => {
      expect(parse('foo(,,)').charge).toEqual({ foo: [''] });
    });
    it('recognized as nested list item value', () => {
      expect(parse('(,,)')).toEqual({ charge: [['']], end: 4 });
    });
  });

  describe('null value', () => {
    it('recognized as top-level value', () => {
      expect(parse('--')).toEqual({ charge: null, end: 2 });
    });
    it('recognized as map entry value', () => {
      expect(parse('foo(--)').charge).toEqual({ foo: null });
    });
    it('recognized as list item value', () => {
      expect(parse(',--').charge).toEqual([null]);
      expect(parse('--,').charge).toEqual([null]);
    });
  });

  describe('decimal number value', () => {
    it('recognized as top-level value', () => {
      expect(parse('123E-2')).toEqual({ charge: 123e-2, end: 6 });
      expect(parse('%3123E-2')).toEqual({ charge: 123e-2, end: 8 });
      expect(parse('%3123E-2')).toEqual({ charge: 123e-2, end: 8 });
      expect(parse('-123E-2')).toEqual({ charge: -123e-2, end: 7 });
      expect(parse('-%3123E-2')).toEqual({ charge: -123e-2, end: 9 });
      expect(parse('%2D123E-2')).toEqual({ charge: -123e-2, end: 9 });
      expect(parse('0')).toEqual({ charge: 0, end: 1 });
      expect(parse('-0')).toEqual({ charge: -0, end: 2 });
    });
    it('recognized as map entry value', () => {
      expect(parse('foo(123E-2)').charge).toEqual({ foo: 123e-2 });
      expect(parse('foo(%3123E-2)').charge).toEqual({ foo: 123e-2 });
      expect(parse('foo(-123E-2)').charge).toEqual({ foo: -123e-2 });
      expect(parse('foo(%2D123E-2)').charge).toEqual({ foo: -123e-2 });
      expect(parse('foo(0)').charge).toEqual({ foo: 0 });
      expect(parse('foo(-0)').charge).toEqual({ foo: -0 });
    });
    it('recognized as list item value', () => {
      expect(parse(',123E-2').charge).toEqual([123e-2]);
      expect(parse(',%3123E-2)').charge).toEqual([123e-2]);
      expect(parse(',-123E-2').charge).toEqual([-123e-2]);
      expect(parse(',%2D123E-2').charge).toEqual([-123e-2]);
      expect(parse(',0').charge).toEqual([0]);
      expect(parse(',-0)').charge).toEqual([-0]);
    });
  });

  describe('binary number value', () => {
    it('recognized as map entry value', () => {
      expect(parse('foo(0b1101)').charge).toEqual({ foo: 0b1101 });
      expect(parse('foo(-0b1101)').charge).toEqual({ foo: -0b1101 });
      expect(parse('foo(0b)').charge).toEqual({ foo: 0 });
      expect(parse('foo(-0b)').charge).toEqual({ foo: -0 });
    });
  });

  describe('hexadecimal number value', () => {
    it('recognized as map entry value', () => {
      expect(parse('foo(0x123)').charge).toEqual({ foo: 0x123 });
      expect(parse('foo(-0x123)').charge).toEqual({ foo: -0x123 });
      expect(parse('foo(0x)').charge).toEqual({ foo: 0 });
      expect(parse('foo(-0x)').charge).toEqual({ foo: -0 });
    });
  });

  describe('opaque entity', () => {
    it('recognized at top level', () => {
      expect(parse('!bar%20baz').charge).toEqual(new UcEntity('!bar%20baz'));
    });
    it('recognized as map entry value', () => {
      expect(parse('foo(!bar%20baz)').charge).toEqual({
        foo: new UcEntity('!bar%20baz'),
      });
    });
    it('recognized as list item value', () => {
      expect(parse(',!bar%20baz').charge).toEqual([new UcEntity('!bar%20baz')]);
      expect(parse('!bar%20baz,').charge).toEqual([new UcEntity('!bar%20baz')]);
      expect(parse(',!bar%20baz,').charge).toEqual([new UcEntity('!bar%20baz')]);
    });
    it('closes hanging parentheses', () => {
      const { raw } = parse('!foo(bar(item1,item2)baz(').charge as UcEntity;

      expect(raw).toBe('!foo(bar(item1,item2)baz())');
    });
  });

  describe('list value', () => {
    it('recognized as top-level value with one item', () => {
      expect(parse('123,').charge).toEqual([123]);
      expect(parse(',123').charge).toEqual([123]);
      expect(parse(',123,').charge).toEqual([123]);
    });
    it('recognized as top-level value', () => {
      expect(parse('123,456').charge).toEqual([123, 456]);
    });
    it('recognized as map entry value', () => {
      expect(parse("foo(1,bar,')").charge).toEqual({
        foo: [1, 'bar', ''],
      });
    });
    it('recognized as map entry value with leading empty string', () => {
      expect(parse("foo(',1)").charge).toEqual({
        foo: ['', 1],
      });
    });
    it('recognized as multiple nested lists', () => {
      expect(parse('foo((1)(bar)())').charge).toEqual({
        foo: [[1], ['bar'], []],
      });
    });
    it('recognized as single nested list', () => {
      expect(parse('foo((1))').charge).toEqual({
        foo: [[1]],
      });
    });
    it('recognized as single empty nested list', () => {
      expect(parse('foo(())').charge).toEqual({
        foo: [[]],
      });
    });
    it('recognized when deeply nested', () => {
      expect(parse('foo(((1)(bar)(!))((2)(baz)(-)))').charge).toEqual({
        foo: [
          [[1], ['bar'], [true]],
          [[2], ['baz'], [false]],
        ],
      });
    });
    it('ignores leading comma', () => {
      expect(parse(',(2),(baz)(-)').charge).toEqual([[2], ['baz'], [false]]);
      expect(parse('(,(2),(baz)(-))').charge).toEqual([[[2], ['baz'], [false]]]);
    });
    it('ignores trailing comma', () => {
      expect(parse('(2),(baz)(-),').charge).toEqual([[2], ['baz'], [false]]);
      expect(parse('((2),(baz)(-),)').charge).toEqual([[[2], ['baz'], [false]]]);
    });
    it('ignores both leading and trailing commas', () => {
      expect(parse(',(2),(baz)(-),').charge).toEqual([[2], ['baz'], [false]]);
      expect(parse('(,(2),(baz)(-),)').charge).toEqual([[[2], ['baz'], [false]]]);
    });
    it('ignores the only comma', () => {
      expect(parse(',').charge).toEqual([]);
      expect(parse('(,)').charge).toEqual([[]]);
      expect(parse('((,))').charge).toEqual([[[]]]);
    });
  });

  describe('map value', () => {
    it('recognized when nested', () => {
      expect(parse('foo(bar(baz))').charge).toEqual({ foo: { bar: 'baz' } });
    });
    it('recognized when deeply nested', () => {
      expect(parse('foo(bar(baz(13)))').charge).toEqual({ foo: { bar: { baz: 13 } } });
    });
  });

  describe('map entry', () => {
    it('recognized with percent-encoded key', () => {
      expect(parse('%27foo%27(13)').charge).toEqual({ "'foo'": 13 });
    });
    it('recognized with escaped key', () => {
      expect(parse('$foo$(13)').charge).toEqual({ foo$: 13 });
    });
    it('recognized with empty key', () => {
      expect(parse('$(13)').charge).toEqual({ '': 13 });
    });
    it('recognized with key only', () => {
      expect(parse('$foo').charge).toEqual({ foo: '' });
    });
    it('recognized after preceding one', () => {
      expect(parse('foo(1)bar(test)baz()suffix').charge).toEqual({
        foo: 1,
        bar: 'test',
        baz: '',
        suffix: '',
      });
    });
    it('recognized after list-valued entry', () => {
      expect(parse('foo(1,bar)test(-)').charge).toEqual({
        foo: [1, 'bar'],
        test: false,
      });
    });
    it('overrides previous value', () => {
      expect(parse('foo(1)foo(bar)foo').charge).toEqual({
        foo: '',
      });
    });
    it('treated as trailing item of top-level list', () => {
      expect(parse('123,456,foo(test)bar(1)tail').charge).toEqual([
        123,
        456,
        { foo: 'test', bar: 1, tail: '' },
      ]);
      expect(parse('(123)(456)foo(test)bar(1)tail').charge).toEqual([
        [123],
        [456],
        { foo: 'test', bar: 1, tail: '' },
      ]);
    });
    it('treated as trailing item of list-valued entry', () => {
      expect(parse('foo(bar((1)(2)test(3))))').charge).toEqual({
        foo: { bar: [[1], [2], { test: 3 }] },
      });
      expect(parse('foo(bar(1,2,test(3))))').charge).toEqual({
        foo: { bar: [1, 2, { test: 3 }] },
      });
    });
  });

  describe('suffix', () => {
    it('parsed for top-level map', () => {
      expect(parse('foo(456)suffix').charge).toEqual({ foo: 456, suffix: '' });
    });
    it('treated as trailing string item after nested list', () => {
      expect(parse('(123)(456)foo').charge).toEqual([[123], [456], 'foo']);
      expect(parse('foo(bar(1)(2)test))').charge).toEqual({
        foo: [{ bar: 1 }, [2], 'test'],
      });
      expect(parse('foo(bar((1)(2)test)))').charge).toEqual({
        foo: { bar: [[1], [2], 'test'] },
      });
    });
    it('treated as map entry containing empty string after single-valued entry', () => {
      expect(parse('foo(bar(baz)test))').charge).toEqual({
        foo: { bar: 'baz', test: '' },
      });
    });
  });

  it('merges maps', () => {
    expect(parse('foo(bar(baz(1)))foo(bar(baz(-)))foo(bar(baz(2)test))').charge).toEqual({
      foo: { bar: { baz: 2, test: '' } },
    });
  });
  it('overrides list', () => {
    expect(parse('foo(bar,baz)foo(bar1,baz1)foo(bar2,baz2)').charge).toEqual({
      foo: ['bar2', 'baz2'],
    });
  });
  it('replaces value with map', () => {
    expect(parse('foo(bar(test))foo(bar(baz(1)test))').charge).toEqual({
      foo: { bar: { baz: 1, test: '' } },
    });
  });
  it('concatenates maps', () => {
    expect(parse('foo(bar(test,test2),bar(baz(1)test(!)),bar(baz(2)test(-)))').charge).toEqual({
      foo: [
        { bar: ['test', 'test2'] },
        { bar: { baz: 1, test: true } },
        { bar: { baz: 2, test: false } },
      ],
    });
  });
  it('concatenates map and value', () => {
    expect(parse('foo(bar(baz(1),test))').charge).toEqual({
      foo: { bar: [{ baz: 1 }, 'test'] },
    });
  });
  it('stops simple value parsing at closing parent', () => {
    expect(parse('foo)')).toEqual({ charge: 'foo', end: 3 });
  });
  it('stops top-level list parsing at closing parent', () => {
    expect(parse(',foo)')).toEqual({ charge: ['foo'], end: 4 });
    expect(parse('foo,)')).toEqual({ charge: ['foo'], end: 4 });
    expect(parse(',foo,)')).toEqual({ charge: ['foo'], end: 5 });
  });
  it('stops nested list parsing at closing parent', () => {
    expect(parse('(foo))')).toEqual({ charge: [['foo']], end: 5 });
    expect(parse(',(foo))')).toEqual({ charge: [['foo']], end: 6 });
    expect(parse('(foo),)')).toEqual({ charge: [['foo']], end: 6 });
    expect(parse(',(foo),)')).toEqual({ charge: [['foo']], end: 7 });
  });
  it('stops nested list parsing after comma', () => {
    expect(parse('(foo,bar,')).toEqual({ charge: [['foo', 'bar']], end: 9 });
  });
  it('stops entries parsing at closing parent', () => {
    expect(parse('foo(bar))')).toEqual({ charge: { foo: 'bar' }, end: 8 });
  });
  it('stops map suffix parsing at closing parent', () => {
    expect(parse('foo(bar)baz)')).toEqual({ charge: { foo: 'bar', baz: '' }, end: 11 });
  });
  it('stops map parsing at the end of input', () => {
    expect(parse('foo(13')).toEqual({
      charge: { foo: 13 },
      end: 6,
    });
  });
  it('stops map parsing at closing parent', () => {
    expect(parse('foo(13))')).toEqual({
      charge: { foo: 13 },
      end: 7,
    });
  });
  it('stops entry value parsing at the end of input', () => {
    expect(parse('foo(1)bar(2)baz(13')).toEqual({
      charge: { foo: 1, bar: 2, baz: 13 },
      end: 18,
    });
  });
  it('stops nested entry value parsing at the end of input', () => {
    expect(parse('foo(bar(baz(13')).toEqual({
      charge: { foo: { bar: { baz: 13 } } },
      end: 14,
    });
  });
  it('stops empty entry value parsing at the end of input', () => {
    expect(parse('foo(1)bar(2)baz(')).toEqual({
      charge: { foo: 1, bar: 2, baz: '' },
      end: 16,
    });
  });
  it('stops nested empty entry value parsing at the end of input', () => {
    expect(parse('foo(bar(baz(')).toEqual({
      charge: { foo: { bar: { baz: '' } } },
      end: 12,
    });
  });

  function parse(input: string): URIChargeParser.Result<UcValue> {
    return parseUcValue(input);
  }
});
