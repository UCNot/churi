import { beforeEach, describe, expect, it } from '@jest/globals';
import { URIChargeCompiler } from '../../compiler/impl/uri-charge.compiler.js';
import '../../spec/uri-charge-matchers.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { URICharge } from '../uri-charge/uri-charge.js';

describe('UcMeta deserializer', () => {
  let parse: UcDeserializer.Sync<URICharge>;

  beforeEach(async () => {
    const compiler = new URIChargeCompiler();

    ({ parseURICharge: parse } = await compiler.evaluate());
  });

  it('attached to single value', () => {
    const charge = parse('!test(value)Hello!%20World!');

    expect(charge).toHaveURIChargeItems('Hello! World!');
    expect(charge.meta.get('test')).toBe('value');
  });
  it('attached multiple times', () => {
    const charge = parse('!test(value1)!test(value2)!test2(value3)Hello!%20World!');

    expect(charge).toHaveURIChargeItems('Hello! World!');
    expect(charge.meta.getAll('test')).toEqual(['value1', 'value2']);
    expect(charge.meta.getAll('test2')).toEqual(['value3']);
  });
  it('attached as list', () => {
    const charge = parse('!test(1, 2)Hello!%20World!');

    expect(charge).toHaveURIChargeItems('Hello! World!');
    expect(charge.meta.get('test')).toEqual([1, 2]);
  });
  it('attached to list items', () => {
    const charge = parse('!test(1)item1,!test(2)item2');

    expect(charge).toHaveURIChargeItems('item1', 'item2');
    expect(charge.meta.get('test')).toBe(1);
    expect(charge.at(0).meta.get('test')).toBe(1);
    expect(charge.at(1).meta.get('test')).toBe(2);
  });
  it('attached to nested list items', () => {
    const charge = parse('!test(0)(!test(1)item1,!test(2)item2)').at(0);

    expect(charge).toHaveURIChargeItems('item1', 'item2');
    expect(charge.meta.getAll('test')).toEqual([1]);
    expect(charge.at(0).meta.getAll('test')).toEqual([1]);
    expect(charge.at(1).meta.getAll('test')).toEqual([2]);
  });
  it('attached to map and its entries', () => {
    const charge = parse('!test(0)first(!test(1)entry1)second(!test(2)entry2)');

    expect(charge).toHaveURIChargeItems({ first: 'entry1', second: 'entry2' });
    expect(charge.meta.get('test')).toBe(0);
    expect(charge.get('first').meta.get('test')).toBe(1);
    expect(charge.get('second').meta.get('test')).toBe(2);
  });
  it('attached to empty map', () => {
    const charge = parse('!test(0)$');

    expect(charge).toHaveURIChargeItems({});
    expect(charge.meta.get('test')).toBe(0);
  });
});
