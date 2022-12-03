import { beforeAll, describe, expect, it } from '@jest/globals';
import { ChURIPrimitive, ChURIValue } from './ch-uri-value.js';
import { OpaqueURIChargeRx } from './opaque.uri-charge-rx.js';
import { createChURIValueParser } from './parse-ch-uri-value.js';
import { URIChargeExt } from './uri-charge-ext.js';
import { URIChargeParser } from './uri-charge-parser.js';
import { URIChargeRx } from './uri-charge-rx.js';

describe('URIChargeExt', () => {
  describe('entity', () => {
    let parser: URIChargeParser<ChURIPrimitive, ChURIValue | TestCharge>;

    beforeAll(() => {
      parser = createChURIValueParser({
        ext: () => ({
          entities: {
            ['!test']({
              rx,
            }: URIChargeExt.Context<ChURIPrimitive, ChURIValue | TestCharge>):
              | ChURIValue
              | TestCharge {
              return rx.setCharge({ [test__symbol]: 'test value' });
            },
          },
        }),
      });
    });

    it('recognized at top level', () => {
      expect(parser.parse('!test')).toEqual({ charge: { [test__symbol]: 'test value' }, end: 5 });
    });
    it('recognized as map entry value', () => {
      expect(parser.parse('foo(!test)')).toEqual({
        charge: { foo: { [test__symbol]: 'test value' } },
        end: 10,
      });
    });
    it('recognized as list item value', () => {
      expect(parser.parse('(!test)')).toEqual({
        charge: [{ [test__symbol]: 'test value' }],
        end: 7,
      });
    });
  });

  describe('directive', () => {
    let parser: URIChargeParser<ChURIPrimitive, ChURIValue | TestCharge>;

    beforeAll(() => {
      parser = new URIChargeParser<ChURIPrimitive, ChURIValue | TestCharge>({
        ext: () => ({
          directives: {
            ['!test'](
              { rx }: URIChargeExt.Context<ChURIPrimitive, ChURIValue | TestCharge>,
              rawName: string,
            ): URIChargeRx.DirectiveRx<ChURIPrimitive, ChURIValue | TestCharge> {
              return new TestDirectiveRx(rx, rawName);
            },
          },
        }),
      });
    });

    it('recognized at top level', () => {
      expect(parser.parse("!test('foo)")).toEqual({ charge: { [test__symbol]: 'foo' }, end: 11 });
    });
    it('recognized as map entry value', () => {
      expect(parser.parse('foo(!test(bar))')).toEqual({
        charge: { foo: { [test__symbol]: 'bar' } },
        end: 15,
      });
    });
    it('recognized as list item value', () => {
      expect(parser.parse('(!test(bar)(baz))')).toEqual({
        charge: [{ [test__symbol]: 'baz' }],
        end: 17,
      });
    });
  });

  const test__symbol = Symbol('testValue');

  interface TestCharge<TValue = ChURIPrimitive> {
    [test__symbol]: ChURIPrimitive | TValue;
  }

  const OpaqueDirectiveRx = OpaqueURIChargeRx.DirectiveRx;

  class TestDirectiveRx<TValue = ChURIPrimitive, TCharge = ChURIValue> extends OpaqueDirectiveRx<
    TValue,
    TCharge | TestCharge<TValue>
  > {

    readonly #rx: URIChargeRx.ValueRx<TValue, TCharge | TestCharge<TValue>>;
    #charge: TCharge | TestCharge<TValue>;

    constructor(rx: URIChargeRx.ValueRx<TValue, TCharge>, rawName: string) {
      super(rx.chargeRx, rawName);
      this.#rx = rx;
      this.#charge = rx.chargeRx.none;
    }

    override add(value: ChURIPrimitive | TValue): void {
      const charge: TestCharge<TValue> = { [test__symbol]: value };

      this.addCharge(charge);
    }

    override addCharge(charge: TCharge | TestCharge<TValue>): void {
      this.#charge = charge;
    }

    endDirective(): TCharge | TestCharge<TValue> {
      return this.#rx.setCharge(this.#charge);
    }

}
});
