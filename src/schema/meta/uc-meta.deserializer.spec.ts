import { beforeEach, describe, expect, it } from '@jest/globals';
import { esline } from 'esgen';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { ucdSupportDefaults } from '../../compiler/deserialization/ucd-support-defaults.js';
import { URIChargeCompiler } from '../../compiler/impl/uri-charge.compiler.js';
import { ucdSupportMetaMapEntity } from '../../spec/meta-map.entity.js';
import { readTokens } from '../../spec/read-chunks.js';
import '../../spec/uri-charge-matchers.js';
import { ucString } from '../string/uc-string.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { ucUnknown } from '../unknown/uc-unknown.js';
import { URICharge } from '../uri-charge/uri-charge.js';

describe('UcMeta deserializer', () => {
  describe('within URI charge', () => {
    let parse: UcDeserializer.Sync<URICharge>;

    beforeEach(async () => {
      const compiler = new URIChargeCompiler();

      ({ parseURICharge: parse } = await compiler.evaluate());
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
    let parse: UcDeserializer.Async<unknown>;

    beforeEach(async () => {
      const compiler = new UcdCompiler({
        models: {
          parse: ucUnknown(),
        },
        features: [ucdSupportDefaults, ucdSupportMetaMapEntity],
      });

      ({ parse } = await compiler.evaluate());
    });

    it('attached to single value', async () => {
      await expect(parse(readTokens('!test(value)!meta-map'))).resolves.toEqual({
        test: ['value'],
      });
    });
    it('attached to list items', async () => {
      await expect(
        parse(readTokens('!test(value1)!meta-map,!test(value2)!meta-map')),
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
        parse(readTokens('first(!test(value1)!meta-map)second(!test(value2)!meta-map)')),
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

    beforeEach(async () => {
      const compiler = new UcdCompiler({
        models: { parse: ucUnknown() },
        features: [
          ucdSupportDefaults,
          compiler => ({
            configure() {
              compiler.parseMetaValue('comment', ucString(), ({ cx, rx, value }) => code => {
                code.write(esline`${rx}.for('comment', ${cx}).str(${value}, ${cx})`);
              });
            },
          }),
        ],
      });

      ({ parse } = await compiler.evaluate());
    });

    it('recognizes meta', () => {
      expect(parse('!comment(Test comment) text(Test value)')).toEqual({
        comment: 'Test comment',
        text: 'Test value',
      });
    });
  });

  describe('with custom handler and default meta setter', () => {
    let parse: UcDeserializer.Sync<URICharge>;

    beforeEach(async () => {
      const compiler = new URIChargeCompiler();

      compiler.parseMetaValue('comment', ucString());

      ({ parseURICharge: parse } = await compiler.evaluate());
    });

    it('recognizes meta', () => {
      const charge = parse('!comment(Test comment) Test value');

      expect(charge).toHaveURIChargeValue('Test value');
      expect(charge.meta.get('comment')).toBe('Test comment');
    });
  });
});
