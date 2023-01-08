import { describe, expect, it } from '@jest/globals';
import { UcNumber } from '../../schema/uc-primitive.js';
import { UccCode } from '../ucc-code.js';
import { UcsLib } from './ucs-lib.js';

describe('UcsLib', () => {
  describe('compileModule', () => {
    it('compiles module', () => {
      const lib = new UcsLib<{ writeValue: UcNumber.Schema }>({
        schemae: { writeValue: UcNumber() },
      });
      const module = lib.compileModule();

      expect(module.lib).toBe(lib);
      expect(new UccCode().write(module).toString()).toBe(module.print());
      expect(module.print()).toContain(`} from '@hatsy/churi/serializer';\n`);
      expect(module.print()).toContain('export async function writeValue(stream, value) {\n');
    });
  });
});
