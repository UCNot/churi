import { beforeAll, describe, expect, it } from '@jest/globals';
import { ChURIArrayBuilder, ChURIObjectBuilder } from './ch-uri-value-builder.js';
import {
  ChURIArrayConsumer,
  ChURIObjectConsumer,
  ChURIValueConsumer,
} from './ch-uri-value-consumer.js';
import { ChURIPrimitive, ChURIValue } from './ch-uri-value.js';
import { URIChargeContext } from './uri-charge-format.js';
import { URIChargeParser } from './uri-charge-parser.js';

describe('URIChargeFormat', () => {
  describe('entity', () => {
    let parser: URIChargeParser<ChURIPrimitive | TestValue, ChURIValue | TestValue>;

    beforeAll(() => {
      parser = new URIChargeParser<ChURIPrimitive | TestValue, ChURIValue | TestValue>({
        format: {
          entities: {
            ['!test']<TCharge>({
              consumer,
            }: URIChargeContext<ChURIPrimitive | TestValue, TCharge>): TCharge {
              return consumer.set({ [test__symbol]: 'test value' }, 'test');
            },
          },
        },
      });
    });

    it('recognized at top level', () => {
      expect(parser.parse('!test')).toEqual({ charge: { [test__symbol]: 'test value' }, end: 5 });
    });
    it('recognized as object property value', () => {
      expect(parser.parse('foo(!test)')).toEqual({
        charge: { foo: { [test__symbol]: 'test value' } },
        end: 10,
      });
    });
    it('recognized as array element value', () => {
      expect(parser.parse('(!test)')).toEqual({
        charge: [{ [test__symbol]: 'test value' }],
        end: 7,
      });
    });
  });

  describe('directive', () => {
    let parser: URIChargeParser<ChURIPrimitive | TestValue, ChURIValue | TestValue>;

    beforeAll(() => {
      parser = new URIChargeParser<ChURIPrimitive | TestValue, ChURIValue | TestValue>({
        format: {
          directives: {
            ['!test']<TCharge>({
              consumer,
            }: URIChargeContext<ChURIPrimitive | TestValue, TCharge>): ChURIArrayConsumer<
              ChURIPrimitive | TestValue,
              TCharge
            > {
              return new TestDirectiveConsumer(consumer);
            },
          },
        },
      });
    });

    it('recognized at top level', () => {
      expect(parser.parse("!test('foo)")).toEqual({ charge: { [test__symbol]: 'foo' }, end: 11 });
    });
    it('recognized as object property value', () => {
      expect(parser.parse('foo(!test(bar))')).toEqual({
        charge: { foo: { [test__symbol]: 'bar' } },
        end: 15,
      });
    });
    it('recognized as array element value', () => {
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

  class TestDirectiveConsumer<TCharge> extends ChURIArrayConsumer<
    ChURIPrimitive | TestValue,
    TCharge
  > {

    readonly #consumer: ChURIValueConsumer<ChURIPrimitive | TestValue, TCharge>;
    #value: unknown;

    constructor(consumer: ChURIValueConsumer<ChURIPrimitive | TestValue, TCharge>) {
      super();
      this.#consumer = consumer;
    }

    override add(value: ChURIValue<ChURIPrimitive | TestValue>): void {
      this.#value = value;
    }

    override startObject(): ChURIObjectConsumer<ChURIPrimitive | TestValue> {
      return new ChURIObjectBuilder();
    }

    override startArray(): ChURIArrayConsumer<ChURIPrimitive | TestValue> {
      return new ChURIArrayBuilder();
    }

    override endArray(): TCharge {
      return this.#consumer.set({ [test__symbol]: this.#value }, 'test');
    }

}
});
