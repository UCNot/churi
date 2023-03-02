import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UcdLib } from './ucd-lib.js';

describe('UcdLib', () => {
  let lib: UcdLib<{ readValue: UcSchema.Spec<number> }>;

  beforeEach(() => {
    lib = new UcdLib<{ readValue: UcSchema.Spec<number> }>({
      schemae: { readValue: Number },
    });
  });

  describe('compile', () => {
    it('creates async factory', () => {
      const compiled = lib.compile('async');

      expect(compiled.lib).toBe(lib);

      const code = new UccCode().write(compiled).toString();

      expect(code).toContain("import('@hatsy/churi/deserializer')");
      expect(code).toContain(
        'async readValue(stream, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(code).toMatch(/\bAsyncUcdReader\b/);
      expect(code).not.toMatch(/\bcreateSyncUcdReader\b/);
    });
    it('creates sync factory', () => {
      const compiled = lib.compile('sync');

      expect(compiled.lib).toBe(lib);

      const code = new UccCode().write(compiled).toString();

      expect(code).toContain("import('@hatsy/churi/deserializer')");
      expect(code).toContain(
        'readValue(input, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(code).toMatch(/\bcreateSyncUcdReader\b/);
      expect(code).not.toMatch(/\bAsyncUcdReader\b/);
    });
    it('creates hybrid factory', () => {
      const compiled = lib.compile();

      expect(compiled.lib).toBe(lib);

      const code = new UccCode().write(compiled).toString();

      expect(code).toContain("import('@hatsy/churi/deserializer')");
      expect(code).toContain(
        'readValue(input, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(code).toMatch(/\bcreateSyncUcdReader\b/);
      expect(code).toMatch(/\bAsyncUcdReader\b/);
    });
  });

  describe('compileModule', () => {
    it('compiles async module', () => {
      const module = lib.compileModule('async');

      expect(module.lib).toBe(lib);

      const code = module.print();

      expect(new UccCode().write(module).toString()).toBe(code);
      expect(code).toContain(`} from '@hatsy/churi/deserializer';\n`);
      expect(code).toContain(
        'export async function readValue(stream, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(code).toMatch(/\bAsyncUcdReader\b/);
      expect(code).not.toMatch(/\bSyncUcdReader\b/);
    });
    it('compiles sync module', () => {
      const module = lib.compileModule('sync');

      expect(module.lib).toBe(lib);

      const code = module.print();

      expect(new UccCode().write(module).toString()).toBe(code);
      expect(code).toContain(`} from '@hatsy/churi/deserializer';\n`);
      expect(code).toContain(
        'export function readValue(input, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(code).toMatch(/\bcreateSyncUcdReader\b/);
      expect(code).not.toMatch(/\bAsyncUcdReader\b/);
    });
    it('compiles hybrid module', () => {
      const module = lib.compileModule();

      expect(module.lib).toBe(lib);

      const code = module.print();

      expect(new UccCode().write(module).toString()).toBe(code);
      expect(code).toContain(`} from '@hatsy/churi/deserializer';\n`);
      expect(code).toContain(
        'export function readValue(input, { onError, onEntity = onEntity$byDefault } = {}) {\n',
      );
      expect(code).toMatch(/\bcreateSyncUcdReader\b/);
      expect(code).toMatch(/\bAsyncUcdReader\b/);
    });
  });
});
