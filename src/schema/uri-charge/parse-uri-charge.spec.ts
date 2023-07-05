import { beforeAll, describe, expect, it } from '@jest/globals';
import { URIChargeCompiler } from '../../compiler/impl/uri-charge.compiler.js';
import '../../spec/uri-charge-matchers.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { URICharge } from './uri-charge.js';

describe('parseURICharge', () => {
  let parse: UcDeserializer.Sync<URICharge>;

  beforeAll(async () => {
    const compiler = new URIChargeCompiler();

    ({ parseURICharge: parse } = await compiler.evaluate());
  });

  describe('string value', () => {
    it('recognized as top-level value', () => {
      const charge = parse('Hello!%20World!');

      expect(charge).toBeURIChargeSingle('string');
      expect(charge).toHaveURIChargeValue('Hello! World!');
      expect(charge).toHaveURIChargeItems('Hello! World!');

      expect(charge.get('some')).toBeURIChargeNone();
      expect(charge.at(-2)).toBeURIChargeNone();
      expect(charge.at(-1)).toBe(charge);
      expect(charge.at(0)).toBe(charge);
      expect(charge.at(1)).toBeURIChargeNone();
      expect([...charge.entries()]).toEqual([]);
      expect([...charge.keys()]).toEqual([]);
    });
    it('recognized as map entry value', () => {
      const map = parse('foo(bar)');

      expect(map).toBeURIChargeMap();
      expect(map).toHaveURIChargeEntries({ foo: 'bar' });
      expect([...map.keys()]).toEqual(['foo']);

      const charge = map.get('foo');

      expect(charge).toBeURIChargeSingle('string');
      expect(charge).toHaveURIChargeValue('bar');
      expect(charge).toHaveURIChargeItems('bar');
      expect(charge.at(-2)).toBeURIChargeNone();
      expect(charge.at(-1)).toBe(charge);
      expect(charge.at(0)).toBe(charge);
      expect(charge.at(1)).toBeURIChargeNone();
    });
    it('recognized as list item value', () => {
      const list = parse(',bar');

      expect(list).toBeURIChargeList(1, 'string');
      expect(list).toHaveURIChargeItems('bar');

      const charge = list.at(0);

      expect(charge).not.toBe(list);
      expect(list).toHaveURIChargeValue('bar');
      expect(list).toHaveURIChargeItems('bar');
      expect(charge.at(-2)).toBeURIChargeNone();
      expect(charge.at(-1)).toBe(charge);
      expect(charge.at(0)).toBe(charge);
      expect(charge.at(1)).toBeURIChargeNone();
    });
    it('recognizes meta', () => {
      const input = '!test1(1)!test2(2)test';
      const charge = parse(input);

      expect(charge.toString()).toBe(input);
    });
  });

  describe('bigint value', () => {
    it('recognized as map entry value', () => {
      const charge = parse('foo(0n13)').get('foo');

      expect(charge).toBeURIChargeSingle('bigint');
      expect(charge).toHaveURIChargeValue(13n);
    });
    it('recognized as list item value', () => {
      const charge = parse(',0n13');

      expect(charge).toBeURIChargeList(1, 'bigint');
      expect(charge).toHaveURIChargeItems(13n);
    });
  });

  describe('empty map', () => {
    it('recognized as top-level value', () => {
      const charge = parse('$');

      expect(charge).toBeURIChargeMap();
      expect(charge).toHaveURIChargeValue(undefined);
      expect(charge).toHaveURIChargeItems({});

      expect(charge).toHaveURIChargeEntries({});
      expect([...charge.entries()]).toHaveLength(0);
      expect([...charge.keys()]).toHaveLength(0);

      expect(charge.at(-2)).toBeURIChargeNone();
      expect(charge.at(-1)).toBe(charge);
      expect(charge.at(0)).toBe(charge);
      expect(charge.at(1)).toBeURIChargeNone();
    });
    it('recognized as map entry value', () => {
      const charge = parse('foo($)').get('foo');

      expect(charge).toBeURIChargeMap();
      expect(charge).toHaveURIChargeEntries({});
      expect([...charge.entries()]).toHaveLength(0);
      expect([...charge.keys()]).toHaveLength(0);
    });
    it('recognized as list item value', () => {
      const list = parse(',$');

      expect(list).toBeURIChargeList(1);

      const charge = list.at(0);

      expect(charge).toBeURIChargeMap();
      expect(charge).toHaveURIChargeEntries({});
      expect([...charge.entries()]).toHaveLength(0);
      expect([...charge.keys()]).toHaveLength(0);
    });
  });

  describe('empty list', () => {
    it('recognized as top-level value', () => {
      const charge = parse(',');

      expect(charge).toBeURIChargeList(0);
      expect(charge.at(0)).toBeURIChargeNone();
      expect(charge.at(0.5)).toBeURIChargeNone();
    });
    it('recognized as map entry value', () => {
      const charge = parse('foo(,)').get('foo');

      expect(charge).toBeURIChargeList(0);
      expect(charge.at(0)).toBeURIChargeNone();
    });
    it('recognized as list item value', () => {
      const list = parse('(,)');

      expect(list).toBeURIChargeList(1, undefined);

      const charge = list.at(0);

      expect(charge).toBeURIChargeList(0);
      expect(charge.at(0)).toBeURIChargeNone();
    });
  });

  describe('null value', () => {
    it('recognized as top-level value', () => {
      const charge = parse('--');

      expect(charge).toBeURIChargeSingle('null');
      expect(charge).toHaveURIChargeValue(null);
    });
    it('recognized as map entry value', () => {
      const charge = parse('foo(--)').get('foo');

      expect(charge).toBeURIChargeSingle('null');
      expect(charge).toHaveURIChargeValue(null);
    });
    it('recognized as list item value', () => {
      const list = parse(',--');

      expect(list).toBeURIChargeList(1, 'null');
      expect(list).toHaveURIChargeItems(null);
    });
  });

  describe('opaque entity', () => {
    it('recognized at top level', () => {
      const charge = parse('!bar%20baz');

      expect(charge).toBeURIChargeSingle('entity');
      expect(charge).toHaveURIChargeValue({ entity: 'bar baz' });
    });
    it('recognized as map entry value', () => {
      const charge = parse('foo(!bar%20baz)').get('foo');

      expect(charge).toBeURIChargeSingle('entity');
      expect(charge).toHaveURIChargeValue({ entity: 'bar baz' });
    });
    it('recognized as list item value', () => {
      const list = parse(',!bar%20baz');

      expect(list).toBeURIChargeList(1, 'entity');
      expect(list).toHaveURIChargeItems({ entity: 'bar baz' });
    });
  });

  describe('list value', () => {
    it('recognized as top-level value with one item', () => {
      const charge = parse('(123)').at(0);

      expect(charge).toBeURIChargeList(1, 'number');
      expect(charge).toHaveURIChargeItems(123);
      expect(charge.at(-2)).toBeURIChargeNone();
      expect(charge.at(-1)).toBe(charge.at(0));
      expect(charge.at(0)).toHaveURIChargeItems(123);
      expect(charge.at(1)).toBeURIChargeNone();

      expect(charge.get('some')).toBeURIChargeNone();
    });
    it('recognized as nested lists top-level list', () => {
      const charge = parse('(123)(456)');

      expect(charge).toBeURIChargeList(2);
      expect(charge).toHaveURIChargeItems([123], [456]);
      expect(charge.at(-3)).toBeURIChargeNone();
      expect(charge.at(-2)).toBe(charge.at(0));
      expect(charge.at(-1)).toBe(charge.at(1));
      expect(charge.at(0)).toHaveURIChargeValue(123);
      expect(charge.at(1)).toHaveURIChargeValue(456);
      expect(charge.at(2)).toBeURIChargeNone();

      expect([...charge.entries()]).toHaveLength(0);
      expect([...charge.keys()]).toHaveLength(0);
    });
    it('recognized as map entry value', () => {
      const charge = parse("foo(1,bar,')").get('foo');

      expect(charge).toBeURIChargeList(3, 'number');
      expect(charge).toHaveURIChargeItems(1, 'bar', '');
      expect(charge.at(-4)).toBeURIChargeNone();
      expect(charge.at(-3)).toBe(charge.at(0));
      expect(charge.at(-2)).toBe(charge.at(1));
      expect(charge.at(-1)).toBe(charge.at(2));
      expect(charge.at(0)).toHaveURIChargeValue(1);
      expect(charge.at(1)).toHaveURIChargeValue('bar');
      expect(charge.at(2)).toHaveURIChargeValue('');
      expect(charge.at(3)).toBeURIChargeNone();
    });
    it('recognized as map entry value with leading empty string', () => {
      const charge = parse("foo(',1)").get('foo');

      expect(charge).toBeURIChargeList(2, 'string');
      expect(charge).toHaveURIChargeItems('', 1);
    });
    it('recognized as multiple nested lists', () => {
      const charge = parse('foo((1)(bar)($))').get('foo');

      expect(charge).toBeURIChargeList(3);
      expect(charge).toHaveURIChargeItems([1], ['bar'], [{}]);
    });
    it('recognized as single nested list', () => {
      const charge = parse('foo((1))').get('foo');

      expect(charge).toBeURIChargeList(1);
      expect(charge).toHaveURIChargeItems([1]);
    });
    it('recognized as single empty nested list', () => {
      const charge = parse('foo(())').get('foo');

      expect(charge).toBeURIChargeList(1);
      expect(charge).toHaveURIChargeItems([]);
    });
    it('recognized when nested', () => {
      const charge = parse('foo(((1)(bar)(!))((2)(baz)(-)))').get('foo');

      expect(charge).toBeURIChargeList(2);
      expect(charge.at(0)).toBeURIChargeList(3);
      expect(charge.at(0)).toHaveURIChargeItems([1], ['bar'], [true]);
      expect(charge.at(1)).toBeURIChargeList(3);
      expect(charge.at(1)).toHaveURIChargeItems([2], ['baz'], [false]);
    });
    it('recognizes item meta', () => {
      const input = '!test1(1)foo,!test2(2)bar';
      const list = parse(input);

      expect(list.toString()).toBe(input);
    });
    it('recognizes map item meta', () => {
      const input = '!test1(1)!test2(2)foo(bar),';
      const map = parse(input);

      expect(map.toString()).toBe(input);
    });
  });

  describe('map value', () => {
    it('recognized when nested', () => {
      const map = parse('foo(bar(baz))');

      expect(map).toBeURIChargeMap();
      expect(map).toHaveURIChargeEntries({ foo: { bar: 'baz' } });

      const charge = map.get('foo');

      expect(charge).toBeURIChargeMap();
      expect(charge).toHaveURIChargeEntries({ bar: 'baz' });
      expect([...charge.keys()]).toEqual(['bar']);

      expect(charge.get('wrong')).toBeURIChargeNone();
    });
    it('recognized when deeply nested', () => {
      expect(parse('foo(bar(baz(13)))')).toHaveURIChargeEntries({
        foo: { bar: { baz: 13 } },
      });
    });
    it('recognizes map meta', () => {
      const input = '!test1(1)foo(bar(!test2(2)baz))';
      const map = parse(input);

      expect(map.toString()).toBe(input);
    });
  });

  it('merges maps', () => {
    expect(parse('foo(bar(baz(1)))foo(bar(baz(-)))foo(bar(baz(2)test))')).toHaveURIChargeItems({
      foo: { bar: { baz: 2, test: '' } },
    });
  });
  it('overrides list', () => {
    expect(parse('foo(bar,baz)foo(bar1,baz1)foo(bar2,baz2)')).toHaveURIChargeItems({
      foo: ['bar2', 'baz2'],
    });
  });
  it('replaces value with map', () => {
    expect(parse('foo(bar(test))foo(bar(baz(1)test))')).toHaveURIChargeItems({
      foo: { bar: { baz: 1, test: '' } },
    });
  });
  it('concatenates maps', () => {
    expect(
      parse('foo(bar(test,test2),bar(baz(1)test(!)),bar(baz(2)test(-)))'),
    ).toHaveURIChargeItems({
      foo: [
        { bar: ['test', 'test2'] },
        { bar: { baz: 1, test: true } },
        { bar: { baz: 2, test: false } },
      ],
    });
  });
  it('concatenates map and value', () => {
    expect(parse('foo(bar(baz(1),test))')).toHaveURIChargeItems({
      foo: { bar: [{ baz: 1 }, 'test'] },
    });
  });
});
