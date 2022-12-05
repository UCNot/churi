import { beforeAll, describe, expect, it } from '@jest/globals';
import { ChURIPrimitive, ChURIValue } from './ch-uri-value.js';
import { OpaqueURIChargeRx } from './opaque.uri-charge-rx.js';
import { createChURIValueParser } from './parse-ch-uri-value.js';
import { URIChargeExt } from './uri-charge-ext.js';
import { URIChargeParser } from './uri-charge-parser.js';
import { URIChargeRx } from './uri-charge-rx.js';

describe('URIChargeExt', () => {
  describe('entity', () => {
    let parser: URIChargeParser<
      ChURIPrimitive | TestCharge,
      ChURIValue<ChURIPrimitive | TestCharge>
    >;

    beforeAll(() => {
      parser = createChURIValueParser({
        ext: (): URIChargeExt<
          ChURIPrimitive | TestCharge,
          ChURIValue<ChURIPrimitive | TestCharge>
        > => ({
          entities: {
            ['!test']({
              rx,
            }: URIChargeExt.Context<
              ChURIPrimitive | TestCharge,
              ChURIValue<ChURIPrimitive | TestCharge>
            >): ChURIValue<ChURIPrimitive | TestCharge> {
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
    let parser: URIChargeParser<
      ChURIPrimitive | TestCharge,
      ChURIValue<ChURIPrimitive | TestCharge>
    >;

    beforeAll(() => {
      parser = createChURIValueParser({
        ext: (): URIChargeExt<
          ChURIPrimitive | TestCharge,
          ChURIValue<ChURIPrimitive | TestCharge>
        > => ({
          directives: {
            ['!test'](
              { rx },
              rawName: string,
            ): URIChargeRx.DirectiveRx<
              ChURIPrimitive | TestCharge,
              ChURIValue<ChURIPrimitive | TestCharge>
            > {
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

  class TestDirectiveRx<
    TValue extends ChURIPrimitive | TestCharge = ChURIPrimitive | TestCharge,
    TCharge extends ChURIValue<ChURIPrimitive | TestCharge> = ChURIValue<
      ChURIPrimitive | TestCharge
    >,
  > extends OpaqueDirectiveRx<TValue, TCharge> {

    readonly #rx: URIChargeRx.ValueRx<TValue, TCharge>;
    #charge: TCharge;

    constructor(rx: URIChargeRx.ValueRx<TValue, TCharge>, rawName: string) {
      super(rx.chargeRx, rawName);
      this.#rx = rx;
      this.#charge = rx.chargeRx.none;
    }

    override add(value: ChURIPrimitive | TValue): void {
      const charge = { [test__symbol]: value } as TCharge;

      this.addCharge(charge);
    }

    override addCharge(charge: TCharge): void {
      this.#charge = charge;
    }

    endDirective(): TCharge {
      return this.#rx.setCharge(this.#charge);
    }

}
});
