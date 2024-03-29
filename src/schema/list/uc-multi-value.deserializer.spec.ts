import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { parseTokens } from '../../spec/read-chunks.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { ucNullable } from '../uc-nullable.js';
import { ucMultiValue } from './uc-multi-value.js';

describe('UcMultiValue deserializer', () => {
  describe('with single: as-is', () => {
    let readList: UcDeserializer.ByTokens<number | number[]>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readList: {
            model: ucMultiValue<number>(Number),
            byTokens: true,
          },
        },
      });

      ({ readList } = await compiler.evaluate());
    });

    it('deserializes list', async () => {
      await expect(readList(parseTokens('1 , 2, 3  '))).resolves.toEqual([1, 2, 3]);
    });
    it('deserializes list with single item', async () => {
      await expect(readList(parseTokens('1,'))).resolves.toEqual([1]);
      await expect(readList(parseTokens(',1'))).resolves.toEqual([1]);
    });
    it('deserializes empty list', async () => {
      await expect(readList(parseTokens(','))).resolves.toEqual([]);
    });
    it('deserializes single item', async () => {
      await expect(readList(parseTokens('13'))).resolves.toBe(13);
    });
  });

  describe('nullable with single: as-is', () => {
    let readList: UcDeserializer.ByTokens<number | number[] | null>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readList: {
            model: ucNullable(ucMultiValue<number>(Number)),
            byTokens: true,
          },
        },
      });

      ({ readList } = await compiler.evaluate());
    });

    it('deserializes null', async () => {
      await expect(readList(parseTokens('--'))).resolves.toBeNull();
    });
  });

  describe('with single: prefer', () => {
    let readList: UcDeserializer.ByTokens<number | number[]>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readList: {
            model: ucMultiValue<number>(Number, { single: 'prefer' }),
            byTokens: true,
          },
        },
      });

      ({ readList } = await compiler.evaluate());
    });

    it('deserializes list', async () => {
      await expect(readList(parseTokens('1 , 2, 3  '))).resolves.toEqual([1, 2, 3]);
    });
    it('deserializes single list item', async () => {
      await expect(readList(parseTokens('1,'))).resolves.toBe(1);
      await expect(readList(parseTokens(',1'))).resolves.toBe(1);
    });
    it('deserializes empty list', async () => {
      await expect(readList(parseTokens(','))).resolves.toEqual([]);
    });
    it('deserializes single item', async () => {
      await expect(readList(parseTokens('13'))).resolves.toBe(13);
    });
  });

  describe('nullable with single: prefer', () => {
    let readList: UcDeserializer.ByTokens<number | number[] | null>;

    beforeAll(async () => {
      const compiler = new UcdCompiler({
        models: {
          readList: {
            model: ucNullable(ucMultiValue<number>(Number, { single: 'prefer' })),
            byTokens: true,
          },
        },
      });

      ({ readList } = await compiler.evaluate());
    });

    it('deserializes null', async () => {
      await expect(readList(parseTokens('--'))).resolves.toBeNull();
    });
  });
});
