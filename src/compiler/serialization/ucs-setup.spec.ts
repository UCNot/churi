import { describe, expect, it } from '@jest/globals';
import { SPEC_MODULE } from '../../impl/module-names.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { UcsSupportNumberAsHex } from '../../spec/write-uc-hex-number.js';
import { UcsSetup } from './ucs-setup.js';

describe('UcsSetup', () => {
  it('respects custom serializer', async () => {
    const setup = new UcsSetup<{ writeValue: UcModel<number> }>({
      models: { writeValue: Number },
      features: UcsSupportNumberAsHex,
    });

    const { writeValue } = await setup.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, 128))).resolves.toBe('0x80');
  });

  describe('generate', () => {
    it('generates module', async () => {
      const setup = new UcsSetup<{ writeValue: UcModel<number> }>({
        models: { writeValue: Number },
      });
      const module = await setup.generate();

      expect(module).toContain(`} from 'churi/serializer.js';\n`);
      expect(module).toContain('export async function writeValue(stream, value) {\n');
    });
    it('fails to serialize unknown schema', async () => {
      const setup = new UcsSetup<{ writeValue: UcModel<number> }>({
        models: { writeValue: { type: 'test-type' } },
        features: UcsSupportNumberAsHex,
      });

      await expect(setup.generate()).rejects.toThrow(
        `test_x2D_type$serialize(writer, value, asItem?): Can not serialize type "test-type"`,
      );
    });
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

      const setup = new UcsSetup<{ writeValue: UcModel<number> }>({
        models: { writeValue: schema },
      });
      const { writeValue } = await setup.evaluate();

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

      const setup = new UcsSetup<{ writeValue: UcModel<number> }>({
        models: { writeValue: schema },
      });
      const { writeValue } = await setup.evaluate();

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
        }).generate(),
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
        }).generate(),
      ).rejects.toThrow(
        new ReferenceError(`Not a serializer feature: import('${SPEC_MODULE}').WrongFeature`),
      );
    });
  });
});
