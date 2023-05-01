import { describe, expect, it } from '@jest/globals';
import { UcModel } from '../../schema/uc-schema.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UcdSetup } from './ucd-setup.js';

describe('UcdLib', () => {
  describe('compile', () => {
    it('creates async factory', async () => {
      const lib = await new UcdSetup<{ readValue: UcModel<number> }, 'async'>({
        models: { readValue: Number },
        mode: 'async',
      }).bootstrap();
      const compiled = lib.compile();

      expect(compiled.lib).toBe(lib);

      const text = await new UccCode().write(compiled).toText();

      expect(text).toContain("import('churi/deserializer.js')");
      expect(text).toContain(
        'async readValue(stream, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(text).toMatch(/\bAsyncUcdReader\b/);
      expect(text).not.toMatch(/\bcreateSyncUcdReader\b/);
    });
    it('creates sync factory', async () => {
      const lib = await new UcdSetup<{ readValue: UcModel<number> }, 'sync'>({
        models: { readValue: Number },
        mode: 'sync',
      }).bootstrap();
      const compiled = lib.compile();

      expect(compiled.lib).toBe(lib);

      const text = await new UccCode().write(compiled).toText();

      expect(text).toContain("import('churi/deserializer.js')");
      expect(text).toContain(
        'readValue(input, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(text).toMatch(/\bcreateSyncUcdReader\b/);
      expect(text).not.toMatch(/\bAsyncUcdReader\b/);
    });
    it('creates universal factory', async () => {
      const lib = await new UcdSetup<{ readValue: UcModel<number> }, 'universal'>({
        models: { readValue: Number },
      }).bootstrap();
      const compiled = lib.compile();

      expect(compiled.lib).toBe(lib);

      const text = await new UccCode().write(compiled).toText();

      expect(text).toContain("import('churi/deserializer.js')");
      expect(text).toContain(
        'readValue(input, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(text).toMatch(/\bcreateSyncUcdReader\b/);
      expect(text).toMatch(/\bAsyncUcdReader\b/);
    });
  });

  describe('compileModule', () => {
    it('compiles async module', async () => {
      const lib = await new UcdSetup<{ readValue: UcModel<number> }, 'async'>({
        models: { readValue: Number },
        mode: 'async',
      }).bootstrap();
      const module = lib.compileModule();

      expect(module.lib).toBe(lib);

      const text = await module.toText();

      await expect(new UccCode().write(module).toText()).resolves.toBe(text);
      expect(text).toContain(`} from 'churi/deserializer.js';\n`);
      expect(text).toContain(
        'export async function readValue(stream, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(text).toMatch(/\bAsyncUcdReader\b/);
      expect(text).not.toMatch(/\bSyncUcdReader\b/);
    });
    it('compiles sync module', async () => {
      const lib = await new UcdSetup<{ readValue: UcModel<number> }, 'sync'>({
        models: { readValue: Number },
        mode: 'sync',
      }).bootstrap();
      const module = lib.compileModule();

      expect(module.lib).toBe(lib);

      const text = await module.toText();

      await expect(new UccCode().write(module).toText()).resolves.toBe(text);
      expect(text).toContain(`} from 'churi/deserializer.js';\n`);
      expect(text).toContain(
        'export function readValue(input, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(text).toMatch(/\bcreateSyncUcdReader\b/);
      expect(text).not.toMatch(/\bAsyncUcdReader\b/);
    });
    it('compiles universal module', async () => {
      const lib = await new UcdSetup<{ readValue: UcModel<number> }, 'universal'>({
        models: { readValue: Number },
      }).bootstrap();
      const module = lib.compileModule();

      expect(module.lib).toBe(lib);

      const text = await module.toText();

      await expect(new UccCode().write(module).toText()).resolves.toBe(text);
      expect(text).toContain(`} from 'churi/deserializer.js';\n`);
      expect(text).toContain(
        'export function readValue(input, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(text).toMatch(/\bcreateSyncUcdReader\b/);
      expect(text).toMatch(/\bAsyncUcdReader\b/);
    });
  });
});
