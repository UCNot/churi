import { beforeEach, describe, expect, it } from '@jest/globals';
import { createUcValueParser } from '../charge/parse-uc-value.js';
import { URIChargeParser } from '../charge/uri-charge-parser.js';
import { UcEntity } from '../schema/uc-entity.js';
import { UcValue } from '../schema/uc-value.js';
import { DirectiveUncharger, unchargeDirective } from './uncharge-directive.js';

describe('unchargeDirective', () => {
  let parser: URIChargeParser<TestValue, UcValue<TestValue>>;

  beforeEach(() => {
    parser = createUcValueParser({ recognize: unchargeDirective('!test', unchargeTestDirective) });
  });

  it('recognizes directive value after colon', () => {
    expect(parser.parse('!test:val')).toEqual({ charge: { [value__symbol]: 'val' }, end: 9 });
  });
  it('recognizes directive value after default delimiter', () => {
    parser = createUcValueParser({
      recognize: unchargeDirective({ prefix: '!test' }, unchargeTestDirective),
    });

    expect(parser.parse('!test:val')).toEqual({ charge: { [value__symbol]: 'val' }, end: 9 });
  });
  it('recognizes directive value after custom delimiter', () => {
    parser = createUcValueParser({
      recognize: unchargeDirective({ prefix: '!test', delimiter: '-' }, unchargeTestDirective),
    });

    expect(parser.parse('!test-val').charge).toEqual({ [value__symbol]: 'val' });
    expect((parser.parse('!test:val').charge as UcEntity).raw).toBe('!test:val');
  });
  it('recognizes directive attributes and value', () => {
    expect(parser.parse('!test(attr(1),attr(2))val').charge).toEqual({
      [value__symbol]: 'val',
      [attributes__symbol]: [{ attr: 1 }, { attr: 2 }],
    });
  });
  it('requires attributes when delimiter is empty', () => {
    parser = createUcValueParser({
      recognize: unchargeDirective({ prefix: '!test', delimiter: '' }, unchargeTestDirective),
    });

    const { raw } = parser.parse('!test:val').charge as UcEntity;

    expect(raw).toBe('!test:val');
    expect(parser.parse('!test(attr)val').charge).toEqual({
      [value__symbol]: 'val',
      [attributes__symbol]: 'attr',
    });
  });
  it('requires attributes when delimiter is `(`', () => {
    parser = createUcValueParser({
      recognize: unchargeDirective({ prefix: '!test', delimiter: '(' }, unchargeTestDirective),
    });

    const { raw } = parser.parse('!test:val').charge as UcEntity;

    expect(raw).toBe('!test:val');
    expect(parser.parse('!test(attr)val').charge).toEqual({
      [value__symbol]: 'val',
      [attributes__symbol]: 'attr',
    });
  });

  function unchargeTestDirective(
    input: DirectiveUncharger.Input<TestValue, UcValue<TestValue>>,
  ): TestValue {
    return {
      [value__symbol]: input.value,
      [attributes__symbol]: input.attributes,
    };
  }

  const value__symbol = Symbol('value');
  const attributes__symbol = Symbol('attributes');

  interface TestValue {
    [value__symbol]: string;
    [attributes__symbol]: UcValue<TestValue> | undefined;
  }
});
