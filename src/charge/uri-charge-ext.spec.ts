import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcPrimitive } from '../schema/uc-primitive.js';
import { UcValue } from '../schema/uc-value.js';
import { createUcValueParser } from './parse-uc-value.js';
import { URIChargeExt } from './uri-charge-ext.js';
import { URIChargeParser } from './uri-charge-parser.js';

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
      expect(parser.parse(',!test')).toEqual({
        charge: [{ [test__symbol]: 'test value' }],
        end: 6,
      });
    });
  });

  const test__symbol = Symbol('testValue');

  interface TestValue {
    [test__symbol]: unknown;
  }
});
