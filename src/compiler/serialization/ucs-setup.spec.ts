import { describe, expect, it } from '@jest/globals';
import { SPEC_MODULE } from '../../impl/module-names.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { UcsSupportNumberAsHex } from '../../spec/write-uc-hex-number.js';
import { UcsSetup } from './ucs-setup.js';

describe('UcsSetup', () => {
  it('respects custom serializer', async () => {
    const lib = await new UcsSetup<{ writeValue: UcModel<number> }>({
      models: { writeValue: Number },
      features: UcsSupportNumberAsHex,
    }).bootstrap();

    const { writeValue } = await lib.compile().toSerializers();

    await expect(TextOutStream.read(async to => await writeValue(to, 128))).resolves.toBe('0x80');
  });

  describe('schema uses', () => {
    it('enables serializer feature', async () => {
      const schema: UcSchema<number> = {
        type: 'hexNumber',
        with: {
          serializer: {
            use: { from: SPEC_MODULE, feature: 'UcsSupportHexNumber' },
          },
        },
      };

      const lib = await new UcsSetup<{ writeValue: UcModel<number> }>({
        models: { writeValue: schema },
      }).bootstrap();
      const { writeValue } = await lib.compile().toSerializers();

      await expect(TextOutStream.read(async to => await writeValue(to, 128))).resolves.toBe('0x80');
    });
    it('enables schema serializer feature', async () => {
      const schema: UcSchema<number> = {
        type: 'hexNumber',
        with: {
          serializer: {
            use: { from: SPEC_MODULE, feature: 'UcsSupportHexNumberSchema' },
          },
        },
      };

      const lib = await new UcsSetup<{ writeValue: UcModel<number> }>({
        models: { writeValue: schema },
      }).bootstrap();
      const { writeValue } = await lib.compile().toSerializers();

      await expect(TextOutStream.read(async to => await writeValue(to, 128))).resolves.toBe('0x80');
    });
    it('fails to enable missing feature', async () => {
      const schema: UcSchema<number> = {
        type: 'hexNumber',
        with: {
          serializer: {
            use: { from: SPEC_MODULE, feature: 'MissingFeature' },
          },
        },
      };

      await expect(
        new UcsSetup<{ writeValue: UcModel<number> }>({
          models: { writeValue: schema },
        }).bootstrap(),
      ).rejects.toThrow(
        new ReferenceError(`No such serializer feature: import('${SPEC_MODULE}').MissingFeature`),
      );
    });
    it('fails to enable wrong feature', async () => {
      const schema: UcSchema<number> = {
        type: 'hexNumber',
        with: {
          serializer: {
            use: { from: SPEC_MODULE, feature: 'WrongFeature' },
          },
        },
      };

      await expect(
        new UcsSetup<{ writeValue: UcModel<number> }>({
          models: { writeValue: schema },
        }).bootstrap(),
      ).rejects.toThrow(
        new ReferenceError(`Not a serializer feature: import('${SPEC_MODULE}').WrongFeature`),
      );
    });
  });
});
