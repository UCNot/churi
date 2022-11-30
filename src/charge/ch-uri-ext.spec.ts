import { beforeAll, describe, expect, it } from '@jest/globals';
import { ChURIExtHandlerContext } from './ch-uri-ext.js';
import {
  ChURIDirectiveBuilder,
  ChURIListBuilder,
  ChURIMapBuilder,
} from './ch-uri-value-builder.js';
import {
  ChURIDirectiveConsumer,
  ChURIListConsumer,
  ChURIMapConsumer,
  ChURIValueConsumer,
} from './ch-uri-value-consumer.js';
import { ChURIEntity, ChURIPrimitive, ChURIValue } from './ch-uri-value.js';
import { URIChargeParser } from './uri-charge-parser.js';

describe('ChURIExt', () => {
  describe('entity', () => {
    let parser: URIChargeParser<ChURIPrimitive | TestValue, ChURIValue | TestValue>;

    beforeAll(() => {
      parser = new URIChargeParser<ChURIPrimitive | TestValue, ChURIValue | TestValue>({
        ext: {
          entities: {
            ['!test']<TCharge>({
              consumer,
            }: ChURIExtHandlerContext<ChURIPrimitive | TestValue, TCharge>): TCharge {
              return consumer.set({ [test__symbol]: 'test value' }, 'test');
            },
          },
        },
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
    let parser: URIChargeParser<ChURIPrimitive | TestValue, ChURIValue | TestValue>;

    beforeAll(() => {
      parser = new URIChargeParser<ChURIPrimitive | TestValue, ChURIValue | TestValue>({
        ext: {
          directives: {
            ['!test']<TCharge>({
              consumer,
            }: ChURIExtHandlerContext<ChURIPrimitive | TestValue, TCharge>): ChURIDirectiveConsumer<
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

  class TestDirectiveConsumer<TCharge>
    implements ChURIDirectiveConsumer<ChURIPrimitive | TestValue, TCharge> {

    readonly #consumer: ChURIValueConsumer<ChURIPrimitive | TestValue, TCharge>;
    #value: unknown;

    constructor(consumer: ChURIValueConsumer<ChURIPrimitive | TestValue, TCharge>) {
      this.#consumer = consumer;
    }

    add(value: ChURIValue<ChURIPrimitive | TestValue>): void {
      this.#value = value;
    }

    addEntity(rawEntity: string): void {
      this.add(new ChURIEntity(rawEntity));
    }

    startMap(): ChURIMapConsumer<ChURIPrimitive | TestValue> {
      return new ChURIMapBuilder(undefined, map => this.add(map));
    }

    startList(): ChURIListConsumer<ChURIPrimitive | TestValue> {
      return new ChURIListBuilder(undefined, list => this.add(list));
    }

    startDirective(rawName: string): ChURIDirectiveConsumer<ChURIPrimitive | TestValue, unknown> {
      return new ChURIDirectiveBuilder(rawName, directive => this.add(directive));
    }

    endDirective(): TCharge {
      return this.#consumer.set({ [test__symbol]: this.#value }, 'test');
    }

}
});
