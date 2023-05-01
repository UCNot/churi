import { describe, expect, it } from '@jest/globals';
import { SPEC_MODULE } from '../../impl/module-names.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { ucdSupportTimestampEntity } from '../../spec/timestamp.ucrx-method.js';
import { UcdSetup } from './ucd-setup.js';
import { ucdSupportDefaults } from './ucd-support-defaults.js';

describe('UcdSetup', () => {
  describe('enables', () => {
    it('enables feature in object form', async () => {
      const lib = await new UcdSetup({
        models: {
          readTimestamp: Number,
        },
        mode: 'sync',
        features: [
          {
            configureDeserializer(setup) {
              setup.enable(ucdSupportTimestampEntity);
            },
          },
          ucdSupportDefaults,
        ],
      }).bootstrap();

      const now = new Date();
      const { readTimestamp } = await lib.compileFactory().toExports();

      expect(readTimestamp(`!timestamp'${now.toISOString()}`)).toBe(now.getTime());
    });
  });

  describe('schema uses', () => {
    it('enables deserializer feature', async () => {
      const schema: UcSchema<number> = {
        type: 'timestamp',
        with: {
          deserializer: {
            use: { from: SPEC_MODULE, feature: 'UcdSupportTimestamp' },
          },
        },
      };
      const lib = await new UcdSetup({
        models: {
          readTimestamp: schema,
        },
        mode: 'sync',
      }).bootstrap();

      const now = new Date();
      const { readTimestamp } = await lib.compileFactory().toExports();

      expect(readTimestamp(`!timestamp'${now.toISOString()}`)).toBe(now.getTime());
    });
    it('enables schema deserializer feature', async () => {
      const schema: UcSchema<number> = {
        type: 'timestamp',
        with: {
          deserializer: {
            use: { from: SPEC_MODULE, feature: 'UcdSupportTimestampSchema' },
          },
        },
      };
      const lib = await new UcdSetup({
        models: {
          readTimestamp: schema,
        },
        mode: 'sync',
      }).bootstrap();

      const now = new Date();
      const { readTimestamp } = await lib.compileFactory().toExports();

      expect(readTimestamp(`!timestamp'${now.toISOString()}`)).toBe(now.getTime());
    });
    it('enables functional schema deserializer feature', async () => {
      const schema: UcSchema<number> = {
        type: 'timestamp',
        with: {
          deserializer: {
            use: { from: SPEC_MODULE, feature: 'ucdSupportTimestampSchema' },
          },
        },
      };
      const lib = await new UcdSetup({
        models: {
          readTimestamp: schema,
        },
        mode: 'sync',
      }).bootstrap();

      const now = new Date();
      const { readTimestamp } = await lib.compileFactory().toExports();

      expect(readTimestamp(`!timestamp'${now.toISOString()}`)).toBe(now.getTime());
    });
    it('fails to enable missing feature', async () => {
      const schema: UcSchema<number> = {
        type: 'timestamp',
        with: {
          deserializer: {
            use: { from: SPEC_MODULE, feature: 'MissingFeature' },
          },
        },
      };

      await expect(
        new UcdSetup<{ readTimestamp: UcModel<number> }>({
          models: { readTimestamp: schema },
        }).bootstrap(),
      ).rejects.toThrow(
        new ReferenceError(`No such deserializer feature: import('${SPEC_MODULE}').MissingFeature`),
      );
    });
    it('fails to enable wrong feature', async () => {
      const schema: UcSchema<number> = {
        type: 'timestamp',
        with: {
          deserializer: {
            use: { from: SPEC_MODULE, feature: 'WrongFeature' },
          },
        },
      };

      await expect(
        new UcdSetup<{ readTimestamp: UcModel<number> }>({
          models: { readTimestamp: schema },
        }).bootstrap(),
      ).rejects.toThrow(
        new ReferenceError(`Not a deserializer feature: import('${SPEC_MODULE}').WrongFeature`),
      );
    });
  });
});
