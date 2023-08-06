import { beforeAll, describe, expect, it } from '@jest/globals';
import { EsEvaluationError, esline } from 'esgen';
import { URIChargeCompiler } from '../../compiler/deserialization/impl/uri-charge.compiler.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { URICharge } from '../uri-charge/uri-charge.js';

import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { ucdProcessDefaults } from '../../compiler/deserialization/ucd-process-defaults.js';
import { ucdProcessMetaMapEntity } from '../../spec/meta-map.entity.js';
import { parseTokens } from '../../spec/read-chunks.js';
import '../../spec/uri-charge-matchers.js';
import { ucString } from '../string/uc-string.js';
import { ucUnknown } from '../unknown/uc-unknown.js';

describe('UcMeta deserializer', () => {
  describe('within URI charge', () => {
    let parse: UcDeserializer.Sync<URICharge>;

    beforeAll(async () => {
      const compiler = new URIChargeCompiler();

      try {
        ({ parseURICharge: parse } = await compiler.evaluate());
      } catch (error) {
        if (error instanceof EsEvaluationError) {
          console.error(1, error.evaluatedCode, error);
        }
        throw error;
      }
    });

    it('attached to single value', () => {
      const charge = parse('!test(value)Hello!%20World!');

      expect(charge).toHaveURIChargeItems('Hello! World!');
      expect(charge.meta.get('test')).toBe('value');
    });
    it('attached multiple times', () => {
      const charge = parse('!test(value1)!test(value2)!test2(value3)Hello!%20World!');

      expect(charge).toHaveURIChargeItems('Hello! World!');
      expect(charge.meta.getAll('test')).toEqual(['value1', 'value2']);
      expect(charge.meta.getAll('test2')).toEqual(['value3']);
    });
    it('attached as list', () => {
      const charge = parse('!test(1, 2)Hello!%20World!');

      expect(charge).toHaveURIChargeItems('Hello! World!');
      expect(charge.meta.get('test')).toEqual([1, 2]);
    });
    it('attached to list items', () => {
      const charge = parse('!test(1)item1,!test(2)item2');

      expect(charge).toHaveURIChargeItems('item1', 'item2');
      expect(charge.meta.get('test')).toBe(1);
      expect(charge.at(0).meta.get('test')).toBe(1);
      expect(charge.at(1).meta.get('test')).toBe(2);
    });
    it('attached to nested list items', () => {
      const charge = parse('!test(0)(!test(1)item1,!test(2)item2)').at(0);

      expect(charge).toHaveURIChargeItems('item1', 'item2');
      expect(charge.meta.getAll('test')).toEqual([1]);
      expect(charge.at(0).meta.getAll('test')).toEqual([1]);
      expect(charge.at(1).meta.getAll('test')).toEqual([2]);
    });
    it('attached to map and its entries', () => {
      const charge = parse('!test(0)first(!test(1)entry1)second(!test(2)entry2)');

      expect(charge).toHaveURIChargeItems({ first: 'entry1', second: 'entry2' });
      expect(charge.meta.get('test')).toBe(0);
      expect(charge.get('first').meta.get('test')).toBe(1);
      expect(charge.get('second').meta.get('test')).toBe(2);
    });
    it('attached to empty map', () => {
      const charge = parse('!test(0)$');

      expect(charge).toHaveURIChargeItems({});
      expect(charge.meta.get('test')).toBe(0);
    });
  });

  describe('within unknown input', () => {
    let parse: UcDeserializer.AsyncByTokens<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          parse: { model: ucUnknown() },
        },
        features: [ucdProcessDefaults, ucdProcessMetaMapEntity],
      });

      try {
        ({ parse } = await compiler.evaluate());
      } catch (error) {
        if (error instanceof EsEvaluationError) {
          console.error(2, error.evaluatedCode, error);
        }
        throw error;
      }
    });

    it('attached to single value', async () => {
      await expect(parse(parseTokens('!test(value)!meta-map'))).resolves.toEqual({
        test: ['value'],
      });
    });
    it('attached to list items', async () => {
      await expect(
        parse(parseTokens('!test(value1)!meta-map,!test(value2)!meta-map')),
      ).resolves.toEqual([
        {
          test: ['value1'],
        },
        {
          test: ['value2'],
        },
      ]);
    });
    it('attached to map entity', async () => {
      await expect(
        parse(parseTokens('first(!test(value1)!meta-map)second(!test(value2)!meta-map)')),
      ).resolves.toEqual({
        first: {
          test: ['value1'],
        },
        second: {
          test: ['value2'],
        },
      });
    });
  });

  describe('with custom handler and meta setter', () => {
    let parse: UcDeserializer.Sync<unknown>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: { parse: { model: ucUnknown() } },
        features: [
          ucdProcessDefaults,
          boot => {
            boot.parseMetaValue('comment', ucString(), ({ cx, value }) => code => {
              code.write(esline`${cx}.data.comment = ${value};`);
            });
          },
        ],
      });

      try {
        ({ parse } = await compiler.evaluate());
      } catch (error) {
        if (error instanceof EsEvaluationError) {
          console.error(3, error.evaluatedCode, error);
        }
        throw error;
      }
    });

    it('recognizes meta', () => {
      const data = {};

      expect(parse('!comment(Test comment) text(Test value)', { data })).toEqual({
        text: 'Test value',
      });
      expect(data).toEqual({
        comment: 'Test comment',
      });
    });
  });

  describe('with custom handler and default meta setter', () => {
    let parse: UcDeserializer.Sync<URICharge>;

    beforeAll(async () => {
      const compiler = new URIChargeCompiler();

      compiler.parseMetaValue('comment', ucString());

      try {
        ({ parseURICharge: parse } = await compiler.evaluate());
      } catch (error) {
        if (error instanceof EsEvaluationError) {
          console.error(4, error.evaluatedCode, error);
        }
        throw error;
      }
    });

    it('recognizes meta', () => {
      const charge = parse('!comment(Test comment) Test value');

      expect(charge).toHaveURIChargeValue('Test value');
      expect(charge.meta.get('comment')).toBe('Test comment');
    });
  });
});
