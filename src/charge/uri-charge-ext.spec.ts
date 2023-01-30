import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcEntity } from '../schema/uc-entity.js';
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

  describe('prefix', () => {
    let parser: URIChargeParser<UcPrimitive | TestValue, UcValue<UcPrimitive | TestValue>>;

    beforeAll(() => {
      parser = createUcValueParser({
        ext: [
          (): URIChargeExt<UcPrimitive | TestValue, UcValue<UcPrimitive | TestValue>> => ({
            entities: {
              ['!test:exact'](): UcValue<UcPrimitive | TestValue> {
                return { [test__symbol]: '(exact)' };
              },
            },
            prefixes: {
              ['!test:'](suffix): UcValue<UcPrimitive | TestValue> {
                return { [test__symbol]: suffix };
              },
              ['!test:longer:'](suffix): UcValue<UcPrimitive | TestValue> {
                return { [test__symbol]: suffix + '(longer)' };
              },
            },
          }),
          (): URIChargeExt<UcPrimitive | TestValue, UcValue<UcPrimitive | TestValue>> => ({
            prefixes: {
              ['!test:'](suffix): UcValue<UcPrimitive | TestValue> | undefined {
                return suffix.startsWith('match')
                  ? { [test__symbol]: suffix.slice(6) + '(match)' }
                  : undefined;
              },
            },
          }),
        ],
      });
    });

    it('recognized at top level', () => {
      expect(parser.parse('!test:value')).toEqual({
        charge: { [test__symbol]: 'value' },
        end: 11,
      });
    });
    it('recognized as map entry value', () => {
      expect(parser.parse('foo(!test:value)')).toEqual({
        charge: { foo: { [test__symbol]: 'value' } },
        end: 16,
      });
    });
    it('recognized as list item value', () => {
      expect(parser.parse(',!test:value')).toEqual({
        charge: [{ [test__symbol]: 'value' }],
        end: 12,
      });
    });
    it('prefers exact match', () => {
      expect(parser.parse('!test:exact').charge).toEqual({
        [test__symbol]: '(exact)',
      });
    });
    it('prefers longer prefix', () => {
      expect(parser.parse('!test:longer:value').charge).toEqual({
        [test__symbol]: 'value(longer)',
      });
    });
    it('applies multiple matchers', () => {
      expect(parser.parse('!test:match:value').charge).toEqual({ [test__symbol]: 'value(match)' });
      expect(parser.parse('!test:non-match:value').charge).toEqual({
        [test__symbol]: 'non-match:value',
      });
    });
    it('does not recognize too short entities', () => {
      const { raw } = parser.parse('!test').charge as UcEntity;

      expect(raw).toBe('!test');
    });
    it('does not recognize unregistered prefix', () => {
      const { raw } = parser.parse('!other').charge as UcEntity;

      expect(raw).toBe('!other');
    });
  });

  const test__symbol = Symbol('testValue');

  interface TestValue {
    [test__symbol]: unknown;
  }
});
