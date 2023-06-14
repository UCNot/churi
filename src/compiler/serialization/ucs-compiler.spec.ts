import { describe, expect, it } from '@jest/globals';
import { SPEC_MODULE } from '../../impl/module-names.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { UcsSupportNumberAsHex } from '../../spec/write-uc-hex-number.js';
import { UcsCompiler } from './ucs-compiler.js';

describe('UcsCompiler', () => {
  it('respects custom serializer', async () => {
    const compiler = new UcsCompiler<{ writeValue: UcModel<number> }>({
      models: { writeValue: Number },
      features: UcsSupportNumberAsHex,
    });

    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, 128))).resolves.toBe('0x80');
  });

  describe('generate', () => {
    it('generates module', async () => {
      const compiler = new UcsCompiler<{ writeValue: UcModel<number> }>({
        models: { writeValue: Number },
      });
      const module = await compiler.generate();

      expect(module).toContain(`} from 'churi/serializer.js';\n`);
      expect(module).toContain('export async function writeValue(stream, value) {\n');
    });
    it('fails to serialize unknown schema', async () => {
      const compiler = new UcsCompiler<{ writeValue: UcModel<number> }>({
        models: { writeValue: { type: 'test-type' } },
        features: UcsSupportNumberAsHex,
      });

      await expect(compiler.generate()).rejects.toThrow(
        `test_x2D_type$serialize(writer, value, asItem?): Can not serialize type "test-type"`,
      );
    });
  });

  describe('schema uses', () => {
    it('enables serializer feature', async () => {
      const schema: UcSchema<number> = {
        type: 'hexNumber',
        where: {
          serializer: {
            use: 'UcsSupportHexNumber',
            from: SPEC_MODULE,
          },
        },
      };

      const compiler = new UcsCompiler<{ writeValue: UcModel<number> }>({
        models: { writeValue: schema },
      });
      const { writeValue } = await compiler.evaluate();

      await expect(TextOutStream.read(async to => await writeValue(to, 128))).resolves.toBe('0x80');
    });
    it('enables schema serializer feature', async () => {
      const schema: UcSchema<number> = {
        type: 'hexNumber',
        where: {
          serializer: {
            use: 'UcsSupportHexNumberSchema',
            from: SPEC_MODULE,
          },
        },
      };

      const compiler = new UcsCompiler<{ writeValue: UcModel<number> }>({
        models: { writeValue: schema },
      });
      const { writeValue } = await compiler.evaluate();

      await expect(TextOutStream.read(async to => await writeValue(to, 128))).resolves.toBe('0x80');
    });
    it('fails to enable missing feature', async () => {
      const schema: UcSchema<number> = {
        type: 'hexNumber',
        where: {
          serializer: {
            use: 'MissingFeature',
            from: SPEC_MODULE,
          },
        },
      };

      await expect(
        new UcsCompiler<{ writeValue: UcModel<number> }>({
          models: { writeValue: schema },
        }).generate(),
      ).rejects.toThrow(
        new ReferenceError(
          `No such schema processing feature: import('${SPEC_MODULE}').MissingFeature`,
        ),
      );
    });
    it('fails to enable wrong feature', async () => {
      const schema: UcSchema<number> = {
        type: 'hexNumber',
        where: {
          serializer: {
            use: 'WrongFeature',
            from: SPEC_MODULE,
          },
        },
      };

      await expect(
        new UcsCompiler<{ writeValue: UcModel<number> }>({
          models: { writeValue: schema },
        }).generate(),
      ).rejects.toThrow(
        new ReferenceError(
          `Not a schema processing feature: import('${SPEC_MODULE}').WrongFeature`,
        ),
      );
    });
  });
});
