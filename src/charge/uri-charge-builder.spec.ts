import { beforeAll, describe, expect, it } from '@jest/globals';
import { ChURIPrimitive } from './ch-uri-value.js';
import { URIChargeBuilder } from './uri-charge-builder.js';
import { URIChargeParser } from './uri-charge-parser.js';
import { URICharge } from './uri-charge.js';

import './impl/uri-charge-matchers.js';

describe('URIChargeBuilder', () => {
  let parser: URIChargeParser<ChURIPrimitive, URICharge>;

  beforeAll(() => {
    parser = new URIChargeParser({ rx: new URIChargeBuilder(), ext: [] });
  });

  describe('string value', () => {
    it('recognized as top-level value', () => {
      const charge = parse('Hello,%20World!').charge;

      expect(charge).toBeURIChargeSingle('string');
      expect(charge).toHaveURIChargeValue('Hello, World!');
    });
    it('recognized as map entry value', () => {
      const charge = parse('foo(bar)').charge.get('foo');

      expect(charge).toBeURIChargeSingle('string');
      expect(charge).toHaveURIChargeValue('bar');
    });
    it('recognized as list item value', () => {
      const charge = parse('(bar)').charge;

      expect(charge).toBeURIChargeList(1, 'string');
      expect(charge).toHaveURIChargeValues('bar');
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
      expect(charge).toHaveURIChargeValues(13n);
    });
  });

  describe('empty map', () => {
    it('recognized as top-level value', () => {
      const charge = parse('').charge;

      expect(charge).toBeURIChargeMap();
    });
    it('recognized as map entry value', () => {
      const charge = parse('foo()').charge.get('foo');

      expect(charge).toBeURIChargeMap();
    });
    it('recognized as list item value', () => {
      const list = parse('()').charge;

      expect(list).toBeURIChargeList(1);
      expect(list.at(0)).toBeURIChargeMap();
    });
  });

  function parse(input: string): URIChargeParser.Result<URICharge> {
    return parser.parse(input);
  }
});
