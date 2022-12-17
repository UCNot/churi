import { beforeAll, describe, expect, it } from '@jest/globals';
import { OpaqueURIChargeRx } from './opaque.uri-charge-rx.js';
import { createUcValueParser } from './parse-uc-value.js';
import { UcPrimitive, UcValue } from './uc-value.js';
import { URIChargeExt } from './uri-charge-ext.js';
import { URIChargeParser } from './uri-charge-parser.js';
import { URIChargeRx } from './uri-charge-rx.js';

describe('URIChargeExt', () => {
  describe('entity', () => {
    let parser: URIChargeParser<UcPrimitive | TestValue, UcValue<UcPrimitive | TestValue>>;

    beforeAll(() => {
      parser = createUcValueParser({
        ext: (): URIChargeExt<UcPrimitive | TestValue, UcValue<UcPrimitive | TestValue>> => ({
          entities: {
            ['!test'](): UcValue<UcPrimitive | TestValue> {
              return { [test__symbol]: 'test value' };
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
    let parser: URIChargeParser<UcPrimitive | TestValue, UcValue<UcPrimitive | TestValue>>;

    beforeAll(() => {
      parser = createUcValueParser({
        ext: (charge): URIChargeExt<UcPrimitive | TestValue, UcValue<UcPrimitive | TestValue>> => ({
          directives: {
            ['!test'](
              rawName: string,
              parse: (
                rx: URIChargeRx.DirectiveRx<
                  UcPrimitive | TestValue,
                  UcValue<UcPrimitive | TestValue>
                >,
              ) => UcValue<UcPrimitive | TestValue>,
            ): UcValue<UcPrimitive | TestValue> {
              return charge.rxValue(rx => parse(new TestDirectiveRx(rx, rawName)));
            },
          },
        }),
      });
    });

    it('recognized at top level', () => {
      expect(parser.parse("!test('foo)")).toEqual({ charge: { [test__symbol]: "'foo" }, end: 11 });
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
    TValue extends UcPrimitive | TestValue = UcPrimitive | TestValue,
  > extends OpaqueDirectiveRx<TValue, UcValue<UcPrimitive | TestValue>> {

    readonly #rx: URIChargeRx.ValueRx<TValue, UcValue<UcPrimitive | TestValue>>;
    #charge: UcValue<UcPrimitive | TestValue>;

    constructor(
      rx: URIChargeRx.ValueRx<TValue, UcValue<UcPrimitive | TestValue>>,
      rawName: string,
    ) {
      super(rx.chargeRx, rawName);
      this.#rx = rx;
      this.#charge = rx.chargeRx.none;
    }

    override addEntity(rawEntity: UcPrimitive | TValue): void {
      const charge: TestValue = { [test__symbol]: rawEntity };

      this.add(charge);
    }

    override add(charge: UcValue<UcPrimitive | TestValue>): void {
      this.#charge = charge;
    }

    endDirective(): UcValue<UcPrimitive | TestValue> {
      this.#rx.add(this.#charge);

      return this.#rx.end();
    }

}
});
