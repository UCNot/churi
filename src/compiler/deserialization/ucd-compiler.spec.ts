import { describe, expect, it } from '@jest/globals';
import { EsBundleFormat } from 'esgen';
import { SPEC_MODULE } from '../../impl/module-names.js';
import { UcModel, UcSchema } from '../../schema/uc-schema.js';
import { ucdSupportTimestampEntity } from '../../spec/timestamp.ucrx-method.js';
import { UcdCompiler } from './ucd-compiler.js';
import { ucdSupportDefaults } from './ucd-support-defaults.js';

describe('UcdCompiler', () => {
  describe('features', () => {
    it('enables feature in object form', async () => {
      const compiler = new UcdCompiler({
        models: {
          readTimestamp: Number,
        },
        mode: 'sync',
        features: [
          {
            configureDeserializer(compiler) {
              compiler.enable(ucdSupportTimestampEntity);
            },
          },
          ucdSupportDefaults,
        ],
      });

      const now = new Date();
      const { readTimestamp } = await compiler.evaluate();

      expect(readTimestamp(`!timestamp'${now.toISOString()}`)).toBe(now.getTime());
    });
  });

  describe('exportEntityHandler', () => {
    it('exports default entity handler', async () => {
      const compiler = new UcdCompiler({
        models: {},
        exportEntityHandler: true,
        features(compiler) {
          ucdSupportDefaults(compiler);
        },
      });

      await expect(compiler.evaluate()).resolves.toEqual({
        onEntity$byDefault: expect.any(Function),
      });
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
      const compiler = new UcdCompiler({
        models: {
          readTimestamp: schema,
        },
        mode: 'sync',
      });

      const now = new Date();
      const { readTimestamp } = await compiler.evaluate();

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
      const compiler = new UcdCompiler({
        models: {
          readTimestamp: schema,
        },
        mode: 'sync',
      });

      const now = new Date();
      const { readTimestamp } = await compiler.evaluate();

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
      const compiler = new UcdCompiler({
        models: {
          readTimestamp: schema,
        },
        mode: 'sync',
      });

      const now = new Date();
      const { readTimestamp } = await compiler.evaluate();

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
        new UcdCompiler<{ readTimestamp: UcModel<number> }>({
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
        new UcdCompiler<{ readTimestamp: UcModel<number> }>({
          models: { readTimestamp: schema },
        }).bootstrap(),
      ).rejects.toThrow(
        new ReferenceError(`Not a deserializer feature: import('${SPEC_MODULE}').WrongFeature`),
      );
    });
  });

  describe('generate', () => {
    describe('ES2015', () => {
      it('compiles async module', async () => {
        const compiler = new UcdCompiler<{ readValue: UcModel<number> }, 'async'>({
          models: { readValue: Number },
          mode: 'async',
        });
        const text = await compiler.generate();

        expect(text).toContain(`} from 'churi/deserializer.js';\n`);
        expect(text).toContain(
          `
export async function readValue(
  stream,
  { onError, onEntity = onEntity$byDefault } = {},
) {
`.trimStart(),
        );
        expect(text).toMatch(/\bAsyncUcdReader\b/);
        expect(text).not.toMatch(/\bSyncUcdReader\b/);
      });
      it('compiles sync module', async () => {
        const compiler = new UcdCompiler<{ readValue: UcModel<number> }, 'sync'>({
          models: { readValue: Number },
          mode: 'sync',
        });
        const text = await compiler.generate();

        expect(text).toContain(`} from 'churi/deserializer.js';\n`);
        expect(text).toContain(
          `
export function readValue(
  input,
  { onError, onEntity = onEntity$byDefault } = {},
) {
`.trimStart(),
        );
        expect(text).toMatch(/\bcreateSyncUcdReader\b/);
        expect(text).not.toMatch(/\bAsyncUcdReader\b/);
      });
      it('compiles universal module', async () => {
        const compiler = new UcdCompiler<{ readValue: UcModel<number> }, 'universal'>({
          models: { readValue: Number },
        });
        const text = await compiler.generate();

        expect(text).toContain(`} from 'churi/deserializer.js';\n`);
        expect(text).toContain(
          `
export function readValue(
  input,
  { onError, onEntity = onEntity$byDefault } = {},
) {
`.trimStart(),
        );
        expect(text).toMatch(/\bcreateSyncUcdReader\b/);
        expect(text).toMatch(/\bAsyncUcdReader\b/);
      });
    });

    describe('IIFE', () => {
      it('creates async factory', async () => {
        const compiler = new UcdCompiler<{ readValue: UcModel<number> }, 'async'>({
          models: { readValue: Number },
          mode: 'async',
        });
        const text = await compiler.generate({ format: EsBundleFormat.IIFE });

        expect(text).toContain("import('churi/deserializer.js')");
        expect(text).toContain(
          `
  async function readValue(
    stream,
    { onError, onEntity = onEntity$byDefault } = {},
  ) {
`.trimStart(),
        );
        expect(text).toMatch(/\bAsyncUcdReader\b/);
        expect(text).not.toMatch(/\bcreateSyncUcdReader\b/);
      });
      it('creates sync factory', async () => {
        const compiler = new UcdCompiler<{ readValue: UcModel<number> }, 'sync'>({
          models: { readValue: Number },
          mode: 'sync',
        });
        const text = await compiler.generate({ format: EsBundleFormat.IIFE });

        expect(text).toContain("import('churi/deserializer.js')");
        expect(text).toContain(
          `
  function readValue(
    input,
    { onError, onEntity = onEntity$byDefault } = {},
  ) {
`.trimStart(),
        );
        expect(text).toMatch(/\bcreateSyncUcdReader\b/);
        expect(text).not.toMatch(/\bAsyncUcdReader\b/);
      });
      it('creates universal factory', async () => {
        const compiler = new UcdCompiler<{ readValue: UcModel<number> }, 'universal'>({
          models: { readValue: Number },
        });
        const text = await compiler.generate({ format: EsBundleFormat.IIFE });

        expect(text).toContain("import('churi/deserializer.js')");
        expect(text).toContain(
          `
  function readValue(
    input,
    { onError, onEntity = onEntity$byDefault } = {},
  ) {
`.trimStart(),
        );
        expect(text).toMatch(/\bcreateSyncUcdReader\b/);
        expect(text).toMatch(/\bAsyncUcdReader\b/);
      });
    });
  });
});
