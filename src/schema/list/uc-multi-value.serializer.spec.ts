import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcsCompiler } from '../../compiler/serialization/ucs-compiler.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { UcSerializer } from '../uc-serializer.js';
import { ucMultiValue } from './uc-multi-value.js';

describe('UcMultiValue serializer', () => {
  describe('single: as-is', () => {
    let writeList: UcSerializer<number | number[]>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeList: ucMultiValue(Number),
        },
      });

      ({ writeList } = await compiler.evaluate());
    });

    it('serializes list', async () => {
      await expect(TextOutStream.read(async to => await writeList(to, [1, 22, 333]))).resolves.toBe(
        ',1,22,333',
      );
    });
    it('serializes empty list', async () => {
      await expect(TextOutStream.read(async to => await writeList(to, []))).resolves.toBe(',');
    });
    it('serializes list with single item as list', async () => {
      await expect(TextOutStream.read(async to => await writeList(to, [13]))).resolves.toBe(',13');
    });
    it('serializes single value as is', async () => {
      await expect(TextOutStream.read(async to => await writeList(to, 13))).resolves.toBe('13');
    });
  });

  describe('single: prefer', () => {
    let writeList: UcSerializer<number | number[]>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeList: ucMultiValue(Number, { single: 'prefer' }),
        },
      });

      ({ writeList } = await compiler.evaluate());
    });

    it('serializes list', async () => {
      await expect(TextOutStream.read(async to => await writeList(to, [1, 22, 333]))).resolves.toBe(
        ',1,22,333',
      );
    });
    it('serializes empty list', async () => {
      await expect(TextOutStream.read(async to => await writeList(to, []))).resolves.toBe(',');
    });
    it('serializes list with single item as single value', async () => {
      await expect(TextOutStream.read(async to => await writeList(to, [13]))).resolves.toBe('13');
    });
    it('serializes single value as is', async () => {
      await expect(TextOutStream.read(async to => await writeList(to, 13))).resolves.toBe('13');
    });
  });
});
