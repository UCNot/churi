import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcPrimitive } from '../schema/uc-primitive.js';
import { UcValue } from '../schema/uc-value.js';
import { OpaqueURIChargeRx } from './opaque.uri-charge-rx.js';
import { createUcValueParser } from './parse-uc-value.js';
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
        ext: (
          chargeRx,
        ): URIChargeExt<UcPrimitive | TestValue, UcValue<UcPrimitive | TestValue>> => ({
          directives: {
            ['!test'](_rawName: string, rawArg: string): UcValue<UcPrimitive | TestValue> {
              return chargeRx.rxValue(
                rx => parser.parseArgs(rawArg, new TestDirectiveRx(rx)).charge,
              );
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

  const OpaqueValueRx = OpaqueURIChargeRx.ValueRx;

  class TestDirectiveRx<
    TValue extends UcPrimitive | TestValue = UcPrimitive | TestValue,
  > extends OpaqueValueRx<TValue, UcValue<UcPrimitive | TestValue>> {

    readonly #rx: URIChargeRx.ValueRx<TValue, UcValue<UcPrimitive | TestValue>>;
    #charge: UcValue<UcPrimitive | TestValue>;

    constructor(rx: URIChargeRx.ValueRx<TValue, UcValue<UcPrimitive | TestValue>>) {
      super(rx.chargeRx);
      this.#rx = rx;
      this.#charge = rx.chargeRx.none;
    }

    override add(charge: UcValue<UcPrimitive | TestValue>): void {
      this.#charge = charge;
    }

    override addValue(value: TValue | UcPrimitive, _type: string): void {
      const charge: TestValue = { [test__symbol]: value };

      this.add(charge);
    }

    end(): UcValue<UcPrimitive | TestValue> {
      this.#rx.add(this.#charge);

      return this.#rx.end();
    }

}
});
