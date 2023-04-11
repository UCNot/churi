import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UcdLib } from './ucd-lib.js';
import { UcdSetup } from './ucd-setup.js';

describe('UcdLib', () => {
  let lib: UcdLib<{ readValue: UcSchema.Spec<number> }>;

  beforeEach(async () => {
    lib = await new UcdSetup<{ readValue: UcSchema.Spec<number> }>({
      schemae: { readValue: Number },
    }).bootstrap();
  });

  describe('compile', () => {
    it('creates async factory', async () => {
      const compiled = lib.compile('async');

      expect(compiled.lib).toBe(lib);

      const text = await new UccCode().write(compiled).toText();

      expect(text).toContain("import('churi/deserializer')");
      expect(text).toContain(
        'async readValue(stream, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(text).toMatch(/\bAsyncUcdReader\b/);
      expect(text).not.toMatch(/\bcreateSyncUcdReader\b/);
    });
    it('creates sync factory', async () => {
      const compiled = lib.compile('sync');

      expect(compiled.lib).toBe(lib);

      const text = await new UccCode().write(compiled).toText();

      expect(text).toContain("import('churi/deserializer')");
      expect(text).toContain(
        'readValue(input, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(text).toMatch(/\bcreateSyncUcdReader\b/);
      expect(text).not.toMatch(/\bAsyncUcdReader\b/);
    });
    it('creates hybrid factory', async () => {
      const compiled = lib.compile();

      expect(compiled.lib).toBe(lib);

      const text = await new UccCode().write(compiled).toText();

      expect(text).toContain("import('churi/deserializer')");
      expect(text).toContain(
        'readValue(input, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(text).toMatch(/\bcreateSyncUcdReader\b/);
      expect(text).toMatch(/\bAsyncUcdReader\b/);
    });
  });

  describe('compileModule', () => {
    it('compiles async module', async () => {
      const module = lib.compileModule('async');

      expect(module.lib).toBe(lib);

      const text = await module.toText();

      await expect(new UccCode().write(module).toText()).resolves.toBe(text);
      expect(text).toContain(`} from 'churi/deserializer';\n`);
      expect(text).toContain(
        'export async function readValue(stream, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(text).toMatch(/\bAsyncUcdReader\b/);
      expect(text).not.toMatch(/\bSyncUcdReader\b/);
    });
    it('compiles sync module', async () => {
      const module = lib.compileModule('sync');

      expect(module.lib).toBe(lib);

      const text = await module.toText();

      await expect(new UccCode().write(module).toText()).resolves.toBe(text);
      expect(text).toContain(`} from 'churi/deserializer';\n`);
      expect(text).toContain(
        'export function readValue(input, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(text).toMatch(/\bcreateSyncUcdReader\b/);
      expect(text).not.toMatch(/\bAsyncUcdReader\b/);
    });
    it('compiles hybrid module', async () => {
      const module = lib.compileModule();

      expect(module.lib).toBe(lib);

      const text = await module.toText();

      await expect(new UccCode().write(module).toText()).resolves.toBe(text);
      expect(text).toContain(`} from 'churi/deserializer';\n`);
      expect(text).toContain(
        'export function readValue(input, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(text).toMatch(/\bcreateSyncUcdReader\b/);
      expect(text).toMatch(/\bAsyncUcdReader\b/);
    });
  });
});
