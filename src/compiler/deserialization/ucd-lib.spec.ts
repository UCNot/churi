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
      const compiled = lib.compileFactory();
      const text = await new UccCode().write(compiled).toText();

      expect(text).toContain("import('churi/deserializer.js')");
      expect(text).toContain('async function readValue(stream, options) {\n');
      expect(text).toMatch(/\bAsyncUcdReader\b/);
      expect(text).not.toMatch(/\bcreateSyncUcdReader\b/);
    });
    it('creates sync factory', async () => {
      const lib = await new UcdSetup<{ readValue: UcModel<number> }, 'sync'>({
        models: { readValue: Number },
        mode: 'sync',
      }).bootstrap();
      const compiled = lib.compileFactory();
      const text = await new UccCode().write(compiled).toText();

      expect(text).toContain("import('churi/deserializer.js')");
      expect(text).toContain('function readValue(input, options) {\n');
      expect(text).toMatch(/\bcreateSyncUcdReader\b/);
      expect(text).not.toMatch(/\bAsyncUcdReader\b/);
    });
    it('creates universal factory', async () => {
      const lib = await new UcdSetup<{ readValue: UcModel<number> }, 'universal'>({
        models: { readValue: Number },
      }).bootstrap();
      const compiled = lib.compileFactory();
      const text = await new UccCode().write(compiled).toText();

      expect(text).toContain("import('churi/deserializer.js')");
      expect(text).toContain('function readValue(input, options) {\n');
      expect(text).toMatch(/\bcreateSyncUcdReader\b/);
      expect(text).toMatch(/\bAsyncUcdReader\b/);
    });
  });

  describe('bundle.compile', () => {
    it('compiles async module', async () => {
      const lib = await new UcdSetup<{ readValue: UcModel<number> }, 'async'>({
        models: { readValue: Number },
        mode: 'async',
      }).bootstrap();
      const module = lib.bundle.compile();
      const text = await module.toText();

      expect(text).toContain(`} from 'churi/deserializer.js';\n`);
      expect(text).toContain('export async function readValue(stream, options) {\n');
      expect(text).toMatch(/\bAsyncUcdReader\b/);
      expect(text).not.toMatch(/\bSyncUcdReader\b/);
    });
    it('compiles sync module', async () => {
      const lib = await new UcdSetup<{ readValue: UcModel<number> }, 'sync'>({
        models: { readValue: Number },
        mode: 'sync',
      }).bootstrap();
      const module = lib.bundle.compile();
      const text = await module.toText();

      expect(text).toContain(`} from 'churi/deserializer.js';\n`);
      expect(text).toContain('export function readValue(input, options) {\n');
      expect(text).toMatch(/\bcreateSyncUcdReader\b/);
      expect(text).not.toMatch(/\bAsyncUcdReader\b/);
    });
    it('compiles universal module', async () => {
      const lib = await new UcdSetup<{ readValue: UcModel<number> }, 'universal'>({
        models: { readValue: Number },
      }).bootstrap();
      const module = lib.bundle.compile();
      const text = await module.toText();

      expect(text).toContain(`} from 'churi/deserializer.js';\n`);
      expect(text).toContain('export function readValue(input, options) {\n');
      expect(text).toMatch(/\bcreateSyncUcdReader\b/);
      expect(text).toMatch(/\bAsyncUcdReader\b/);
    });
  });
});
