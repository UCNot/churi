import { beforeAll, describe, expect, it } from '@jest/globals';
import { ChURIPrimitive, ChURIValue } from './ch-uri-value.js';
import { OpaqueURIChargeRx } from './opaque.uri-charge-rx.js';
import { createChURIValueParser } from './parse-ch-uri-value.js';
import { URIChargeExt } from './uri-charge-ext.js';
import { URIChargeParser } from './uri-charge-parser.js';
import { URIChargeRx } from './uri-charge-rx.js';

describe('URIChargeExt', () => {
  describe('entity', () => {
    let parser: URIChargeParser<ChURIPrimitive | TestValue, ChURIValue<ChURIPrimitive | TestValue>>;

    beforeAll(() => {
      parser = createChURIValueParser({
        ext: (): URIChargeExt<
          ChURIPrimitive | TestValue,
          ChURIValue<ChURIPrimitive | TestValue>
        > => ({
          entities: {
            ['!test']({
              rx,
            }: URIChargeExt.Context<
              ChURIPrimitive | TestValue,
              ChURIValue<ChURIPrimitive | TestValue>
            >): ChURIValue<ChURIPrimitive | TestValue> {
              return rx.set({ [test__symbol]: 'test value' });
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
    let parser: URIChargeParser<ChURIPrimitive | TestValue, ChURIValue<ChURIPrimitive | TestValue>>;

    beforeAll(() => {
      parser = createChURIValueParser({
        ext: (): URIChargeExt<
          ChURIPrimitive | TestValue,
          ChURIValue<ChURIPrimitive | TestValue>
        > => ({
          directives: {
            ['!test'](
              { rx },
              rawName: string,
            ): URIChargeRx.DirectiveRx<
              ChURIPrimitive | TestValue,
              ChURIValue<ChURIPrimitive | TestValue>
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

  interface TestValue {
    [test__symbol]: unknown;
  }

  const OpaqueDirectiveRx = OpaqueURIChargeRx.DirectiveRx;

  class TestDirectiveRx<
    TValue extends ChURIPrimitive | TestValue = ChURIPrimitive | TestValue,
  > extends OpaqueDirectiveRx<TValue, ChURIValue<ChURIPrimitive | TestValue>> {

    readonly #rx: URIChargeRx.ValueRx<TValue, ChURIValue<ChURIPrimitive | TestValue>>;
    #charge: ChURIValue<ChURIPrimitive | TestValue>;

    constructor(
      rx: URIChargeRx.ValueRx<TValue, ChURIValue<ChURIPrimitive | TestValue>>,
      rawName: string,
    ) {
      super(rx.chargeRx, rawName);
      this.#rx = rx;
      this.#charge = rx.chargeRx.none;
    }

    override addValue(value: ChURIPrimitive | TValue): void {
      const charge: TestValue = { [test__symbol]: value };

      this.add(charge);
    }

    override add(charge: ChURIValue<ChURIPrimitive | TestValue>): void {
      this.#charge = charge;
    }

    endDirective(): ChURIValue<ChURIPrimitive | TestValue> {
      return this.#rx.set(this.#charge);
    }

}
});
