import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UcsLib } from './ucs-lib.js';

describe('UcsLib', () => {
  describe('serializerFor', () => {
    let lib: UcsLib<{ writeValue: UcSchema.Spec<number> }>;

    beforeEach(() => {
      lib = new UcsLib<{ writeValue: UcSchema.Spec<number> }>({
        schemae: { writeValue: Number },
      });
    });

    it('obtains serializer for unknown schema', () => {
      const fn = lib.serializerFor({ type: String });

      expect(fn.name).toBe('String$serialize');
    });
    it('obtains serializer for unknown named schema', () => {
      const fn = lib.serializerFor({ type: 'string' });

      expect(fn.name).toBe('string$serialize');
    });
  });

  describe('compileModule', () => {
    it('compiles module', () => {
      const lib = new UcsLib<{ writeValue: UcSchema.Spec<number> }>({
        schemae: { writeValue: Number },
      });
      const module = lib.compileModule();

      expect(module.lib).toBe(lib);
      expect(new UccCode().write(module).toString()).toBe(module.print());
      expect(module.print()).toContain(`} from 'churi/serializer';\n`);
      expect(module.print()).toContain('export async function writeValue(stream, value) {\n');
    });
  });
});
