import { describe, expect, it } from '@jest/globals';
import '../spec/uri-charge-matchers.js';
import { createURIChargeParser, parseURICharge } from './parse-uri-charge.js';
import { URIChargeBuilder } from './uri-charge-builder.js';
import { URIChargeParser } from './uri-charge-parser.js';
import { URICharge } from './uri-charge.js';

describe('createURIChargeParser', () => {
  it('returns default instance without options', () => {
    expect(createURIChargeParser()).toBe(createURIChargeParser());
  });
  it('returns new instance with options', () => {
    expect(createURIChargeParser({})).not.toBe(createURIChargeParser());
  });

  describe('parseArgs', () => {
    it('builds args', () => {
      const parser = createURIChargeParser();
      const charge = parser.parseArgs('Hello,%20World!').charge;

      expect(charge).toBeURIChargeSingle('string');
      expect(charge).toHaveURIChargeValue('Hello, World!');
    });
    it('builds args by custom parser', () => {
      const parser = createURIChargeParser();
      const charge = parser.chargeRx.rxValue(rx => parser.parseArgs('Hello,%20World!', rx).charge);

      expect(charge).toBeURIChargeSingle('string');
      expect(charge).toHaveURIChargeValue('Hello, World!');
    });
  });
});

describe('parseURICharge', () => {
  describe('string value', () => {
    it('recognized as top-level value', () => {
      const charge = parse('Hello,%20World!').charge;

      expect(charge).toBeURIChargeSingle('string');
      expect(charge).toHaveURIChargeValue('Hello, World!');
      expect(charge).toHaveURIChargeItems('Hello, World!');

      expect(charge.get('some')).toBeURIChargeNone();
      expect(charge.at(-2)).toBeURIChargeNone();
      expect(charge.at(-1)).toBe(charge);
      expect(charge.at(0)).toBe(charge);
      expect(charge.at(1)).toBeURIChargeNone();
    });
    it('recognized as map entry value', () => {
      const map = parse('foo(bar)').charge;

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
      const list = parse('(bar)').charge;

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
  });

  describe('bigint value', () => {
    it('recognized as map entry value', () => {
      const charge = parse('foo(0n13)').charge.get('foo');

      expect(charge).toBeURIChargeSingle('bigint');
      expect(charge).toHaveURIChargeValue(13n);
    });
    it('recognized as list item value', () => {
      const charge = parse('(0n13)').charge;

      expect(charge).toBeURIChargeList(1, 'bigint');
      expect(charge).toHaveURIChargeItems(13n);
    });
  });

  describe('empty map', () => {
    it('recognized as top-level value', () => {
      const charge = parse('!()').charge;

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
      const charge = parse('foo(!())').charge.get('foo');

      expect(charge).toBeURIChargeMap();
      expect(charge).toHaveURIChargeEntries({});
      expect([...charge.entries()]).toHaveLength(0);
      expect([...charge.keys()]).toHaveLength(0);
    });
    it('recognized as list item value', () => {
      const list = parse('(!())').charge;

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
      const charge = parse('!!').charge;

      expect(charge).toBeURIChargeList(0);
      expect(charge.at(0)).toBeURIChargeNone();
      expect(charge.at(0.5)).toBeURIChargeNone();
    });
    it('recognized as map entry value', () => {
      const charge = parse('foo(!!)').charge.get('foo');

      expect(charge).toBeURIChargeList(0);
      expect(charge.at(0)).toBeURIChargeNone();
    });
    it('recognized as list item value', () => {
      const list = parse('(!!)').charge;

      expect(list).toBeURIChargeList(1, undefined);

      const charge = list.at(0);

      expect(charge).toBeURIChargeList(0);
      expect(charge.at(0)).toBeURIChargeNone();
    });
  });

  describe('null value', () => {
    it('recognized as top-level value', () => {
      const charge = parse('--').charge;

      expect(charge).toBeURIChargeSingle('null');
      expect(charge).toHaveURIChargeValue(null);
    });
    it('recognized as map entry value', () => {
      const charge = parse('foo(--)').charge.get('foo');

      expect(charge).toBeURIChargeSingle('null');
      expect(charge).toHaveURIChargeValue(null);
    });
    it('recognized as list item value', () => {
      const list = parse('(--)').charge;

      expect(list).toBeURIChargeList(1, 'null');
      expect(list).toHaveURIChargeItems(null);
    });
  });

  describe('unknown entity', () => {
    it('recognized at top level', () => {
      const charge = parse('!bar%20baz').charge;

      expect(charge).toBeURIChargeSingle('entity');
      expect(charge).toHaveURIChargeValue({ raw: '!bar%20baz' });
    });
    it('recognized as map entry value', () => {
      const charge = parse('foo(!bar%20baz)').charge.get('foo');

      expect(charge).toBeURIChargeSingle('entity');
      expect(charge).toHaveURIChargeValue({ raw: '!bar%20baz' });
    });
    it('recognized as list item value', () => {
      const list = parse('(!bar%20baz)').charge;

      expect(list).toBeURIChargeList(1, 'entity');
      expect(list).toHaveURIChargeItems({ raw: '!bar%20baz' });
    });
  });

  describe('list value', () => {
    it('recognized as top-level value with one item', () => {
      const charge = parse('(123)').charge;

      expect(charge).toBeURIChargeList(1, 'number');
      expect(charge).toHaveURIChargeItems(123);
      expect(charge.at(-2)).toBeURIChargeNone();
      expect(charge.at(-1)).toBe(charge.at(0));
      expect(charge.at(0)).toHaveURIChargeItems(123);
      expect(charge.at(1)).toBeURIChargeNone();

      expect(charge.get('some')).toBeURIChargeNone();
    });
    it('recognized as top-level value', () => {
      const charge = parse('(123)(456)').charge;

      expect(charge).toBeURIChargeList(2, 'number');
      expect(charge).toHaveURIChargeItems(123, 456);
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
      const charge = parse('foo(1)(bar)()').charge.get('foo');

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
      const charge = parse('foo()(1)').charge.get('foo');

      expect(charge).toBeURIChargeList(2, 'string');
      expect(charge).toHaveURIChargeItems('', 1);
    });
    it('recognized with multiple items', () => {
      const charge = parse('foo((1)(bar)(!()))').charge.get('foo');

      expect(charge).toBeURIChargeList(3, 'number');
      expect(charge).toHaveURIChargeItems(1, 'bar', {});
    });
    it('recognized with single item', () => {
      const charge = parse('foo((1))').charge.get('foo');

      expect(charge).toBeURIChargeList(1, 'number');
      expect(charge).toHaveURIChargeItems(1);
    });
    it('recognized with single item containing empty string', () => {
      const charge = parse('foo(())').charge.get('foo');

      expect(charge).toBeURIChargeList(1, 'string');
      expect(charge).toHaveURIChargeItems('');
    });
    it('recognized when nested', () => {
      const charge = parse('foo(((1)(bar)(!))((2)(baz)(-)))').charge.get('foo');

      expect(charge).toBeURIChargeList(2);
      expect(charge.at(0)).toBeURIChargeList(3, 'number');
      expect(charge.at(0)).toHaveURIChargeItems(1, 'bar', true);
      expect(charge.at(1)).toBeURIChargeList(3, 'number');
      expect(charge.at(1)).toHaveURIChargeItems(2, 'baz', false);
    });
  });

  describe('map value', () => {
    it('recognized when nested', () => {
      const map = parse('foo(bar(baz))').charge;

      expect(map).toBeURIChargeMap();
      expect(map).toHaveURIChargeEntries({ foo: { bar: 'baz' } });

      const charge = map.get('foo');

      expect(charge).toBeURIChargeMap();
      expect(charge).toHaveURIChargeEntries({ bar: 'baz' });
      expect([...charge.keys()]).toEqual(['bar']);

      expect(charge.get('wrong')).toBeURIChargeNone();
    });
    it('recognized when deeply nested', () => {
      expect(parse('foo(bar(baz(13)))').charge).toHaveURIChargeEntries({
        foo: { bar: { baz: 13 } },
      });
    });
  });

  describe('unknown directive', () => {
    it('recognized as top-level value', () => {
      const charge = parse('!bar%20baz(foo)((1))test').charge;

      expect(charge).toBeURIChargeSingle('directive');
      expect(charge).toHaveURIChargeValue({
        rawName: '!bar%20baz',
        arg: [{ raw: 'foo' }, [1], { test: '' }],
      });

      expect(charge.get('value')).toBeURIChargeNone();
      expect([...charge.entries()]).toHaveLength(0);
      expect([...charge.keys()]).toHaveLength(0);
    });
    it('recognized as map entry value', () => {
      expect(parse('foo(!bar%20baz(1))').charge).toHaveURIChargeItems({
        foo: { rawName: '!bar%20baz', arg: { raw: '1' } },
      });
    });
    it('recognized as list item value', () => {
      expect(parse('(!bar%20baz())').charge).toHaveURIChargeItems({
        rawName: '!bar%20baz',
        arg: { raw: '' },
      });
    });
    it('recognized without parameters', () => {
      const charge = new URIChargeBuilder().rxDirective('!test', rx => rx.end());

      expect(charge).toHaveURIChargeValue({ rawName: '!test', arg: undefined });
    });
  });

  it('merges maps', () => {
    expect(
      parse('foo(bar(baz(1)))foo(bar(baz(-)))foo(bar(baz(2)test))').charge,
    ).toHaveURIChargeItems({
      foo: { bar: { baz: 2, test: '' } },
    });
  });
  it('overrides list', () => {
    expect(parse('foo(bar)(baz)foo(bar1)(baz1)foo(bar2)(baz2)').charge).toHaveURIChargeItems({
      foo: ['bar2', 'baz2'],
    });
  });
  it('replaces value with map', () => {
    expect(parse('foo(bar(test))foo(bar(baz(1)test))').charge).toHaveURIChargeItems({
      foo: { bar: { baz: 1, test: '' } },
    });
  });
  it('concatenates maps', () => {
    expect(
      parse('foo(bar(test)(test2))(bar(baz(1)test(!)))(bar(baz(2)test(-)))').charge,
    ).toHaveURIChargeItems({
      foo: [
        { bar: ['test', 'test2'] },
        { bar: { baz: 1, test: true } },
        { bar: { baz: 2, test: false } },
      ],
    });
  });
  it('concatenates map and value', () => {
    expect(parse('foo(bar(baz(1))(test))').charge).toHaveURIChargeItems({
      foo: { bar: [{ baz: 1 }, 'test'] },
    });
  });

  function parse(input: string): URIChargeParser.Result<URICharge> {
    return parseURICharge(input);
  }
});
