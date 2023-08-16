import { describe, expect, it } from '@jest/globals';
import { EsBundleFormat } from 'esgen';
import { SPEC_MODULE } from '../../impl/module-names.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { ucdProcessTimestampFormat } from '../../spec/timestamp.format.js';
import { UcdCompiler } from './ucd-compiler.js';
import { ucdProcessDefaults } from './ucd-process-defaults.js';

describe('UcdCompiler', () => {
  describe('features', () => {
    it('enables feature in object form', async () => {
      const compiler = new UcdCompiler({
        models: {
          readTimestamp: { model: Number, mode: 'sync' },
        },
        features: [
          {
            uccEnable(boot) {
              boot.enable(ucdProcessTimestampFormat);
            },
          },
          ucdProcessDefaults,
        ],
      });

      const now = new Date();
      const { readTimestamp } = await compiler.evaluate();

      expect(readTimestamp(`!timestamp'${now.toISOString()}`)).toBe(now.getTime());
    });
  });

  describe('exportDefaults', () => {
    it('exports default entity handler', async () => {
      const compiler = new UcdCompiler({
        models: {},
        exportDefaults: true,
        features(compiler) {
          return ucdProcessDefaults(compiler);
        },
      });

      await expect(compiler.evaluate()).resolves.toEqual({
        defaultEntities: expect.objectContaining({
          Infinity: expect.any(Function),
          '-Infinity': expect.any(Function),
          NaN: expect.any(Function),
        }),
      });
    });
  });

  describe('schema constraints', () => {
    it('enables deserializer feature', async () => {
      const schema: UcSchema<number> = {
        type: 'timestamp',
        where: {
          deserializer: {
            use: 'UcdProcessTimestamp',
            from: SPEC_MODULE,
          },
        },
      };
      const compiler = new UcdCompiler({
        models: {
          readTimestamp: { model: schema, mode: 'sync' },
        },
      });

      const now = new Date();
      const { readTimestamp } = await compiler.evaluate();

      expect(readTimestamp(`!timestamp'${now.toISOString()}`)).toBe(now.getTime());
    });
    it('enables schema deserializer feature', async () => {
      const schema: UcSchema<number> = {
        type: 'timestamp',
        where: {
          deserializer: {
            use: 'UcdProcessTimestampSchema',
            from: SPEC_MODULE,
          },
        },
      };
      const compiler = new UcdCompiler({
        models: {
          readTimestamp: { model: schema, mode: 'sync' },
        },
      });

      const now = new Date();
      const { readTimestamp } = await compiler.evaluate();

      expect(readTimestamp(`!timestamp'${now.toISOString()}`)).toBe(now.getTime());
    });
    it('enables functional schema deserializer feature', async () => {
      const schema: UcSchema<number> = {
        type: 'timestamp',
        where: {
          deserializer: {
            use: 'ucdProcessTimestampSchema',
            from: SPEC_MODULE,
          },
        },
      };
      const compiler = new UcdCompiler({
        models: {
          readTimestamp: { model: schema, mode: 'sync' },
        },
      });

      const now = new Date();
      const { readTimestamp } = await compiler.evaluate();

      expect(readTimestamp(`!timestamp'${now.toISOString()}`)).toBe(now.getTime());
    });
  });

  describe('generate', () => {
    describe('ES2015', () => {
      it('compiles async module', async () => {
        const compiler = new UcdCompiler({
          models: { readValue: { model: Number, mode: 'async' } },
        });
        const text = await compiler.generate();

        expect(text).toContain(`} from 'churi/deserializer.js';\n`);
        expect(text).toContain(
          `
export async function readValue(
  stream,
  {
    data,
    onError,
    entities = defaultEntities,
    formats,
    onMeta = onMeta$byDefault,
  } = {},
) {
`.trimStart(),
        );
        expect(text).toMatch(/\bAsyncUcdReader\b/);
        expect(text).not.toMatch(/\bSyncUcdReader\b/);
        await expect(compiler.generate()).resolves.toBe(text);
      });
      it('compiles sync module', async () => {
        const compiler = new UcdCompiler({
          models: { readValue: { model: Number, mode: 'sync', byTokens: true } },
        });
        const text = await compiler.generate();

        expect(text).toContain(`} from 'churi/deserializer.js';\n`);
        expect(text).toContain(
          `
export function readValue(
  input,
  {
    data,
    onError,
    entities = defaultEntities,
    formats,
    onMeta = onMeta$byDefault,
  } = {},
) {
`.trimStart(),
        );
        expect(text).toMatch(/\bcreateSyncUcdReader\b/);
        expect(text).not.toMatch(/\bAsyncUcdReader\b/);
      });
      it('compiles universal module', async () => {
        const compiler = new UcdCompiler({
          models: { readValue: { model: Number, byTokens: true } },
        });
        const text = await compiler.generate();

        expect(text).toContain(`} from 'churi/deserializer.js';\n`);
        expect(text).toContain(
          `
export function readValue(
  input,
  {
    data,
    onError,
    entities = defaultEntities,
    formats,
    onMeta = onMeta$byDefault,
  } = {},
) {
`.trimStart(),
        );
        expect(text).toMatch(/\bcreateSyncUcdReader\b/);
        expect(text).toMatch(/\bAsyncUcdReader\b/);
        await expect(compiler.generate()).resolves.toBe(text);
      });
    });

    describe('IIFE', () => {
      it('creates async factory', async () => {
        const compiler = new UcdCompiler({
          models: { readValue: { model: Number, mode: 'async' } },
        });
        const text = await compiler.generate({ format: EsBundleFormat.IIFE });

        expect(text).toContain("import('churi/deserializer.js')");
        expect(text).toContain(
          `
  async function readValue(
    stream,
    {
      data,
      onError,
      entities = defaultEntities,
      formats,
      onMeta = onMeta$byDefault,
    } = {},
  ) {
`.trimStart(),
        );
        expect(text).toMatch(/\bAsyncUcdReader\b/);
        expect(text).not.toMatch(/\bcreateSyncUcdReader\b/);
        await expect(compiler.generate({ format: EsBundleFormat.IIFE })).resolves.toBe(text);
      });
      it('creates sync factory', async () => {
        const compiler = new UcdCompiler({
          models: { readValue: { model: Number, mode: 'sync', byTokens: true } },
        });
        const text = await compiler.generate({ format: EsBundleFormat.IIFE });

        expect(text).toContain("import('churi/deserializer.js')");
        expect(text).toContain(
          `
  function readValue(
    input,
    {
      data,
      onError,
      entities = defaultEntities,
      formats,
      onMeta = onMeta$byDefault,
    } = {},
  ) {
`.trimStart(),
        );
        expect(text).toMatch(/\bcreateSyncUcdReader\b/);
        expect(text).not.toMatch(/\bAsyncUcdReader\b/);
        await expect(compiler.generate({ format: EsBundleFormat.IIFE })).resolves.toBe(text);
      });
      it('creates universal factory', async () => {
        const compiler = new UcdCompiler({
          models: { readValue: { model: Number, byTokens: true } },
        });
        const text = await compiler.generate({ format: EsBundleFormat.IIFE });

        expect(text).toContain("import('churi/deserializer.js')");
        expect(text).toContain(
          `
  function readValue(
    input,
    {
      data,
      onError,
      entities = defaultEntities,
      formats,
      onMeta = onMeta$byDefault,
    } = {},
  ) {
`.trimStart(),
        );
        expect(text).toMatch(/\bcreateSyncUcdReader\b/);
        expect(text).toMatch(/\bAsyncUcdReader\b/);
        await expect(compiler.generate({ format: EsBundleFormat.IIFE })).resolves.toBe(text);
      });
    });
  });
});
