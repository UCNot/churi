import { describe, expect, it } from '@jest/globals';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UcdLib } from './ucd-lib.js';

describe('UcdLib', () => {
  describe('compileModule', () => {
    it('compiles module', () => {
      const lib = new UcdLib<{ readValue: UcSchema.Spec<number> }>({
        schemae: { readValue: Number },
      });
      const module = lib.compileModule();

      expect(module.lib).toBe(lib);
      expect(new UccCode().write(module).toString()).toBe(module.print());
      expect(module.print()).toContain(`} from '@hatsy/churi/deserializer';\n`);
      expect(module.print()).toContain('export async function readValue(stream, options) {\n');
    });
  });
});
