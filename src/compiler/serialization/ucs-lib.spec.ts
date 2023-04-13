import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../codegen/ucc-code.js';
import { UcsLib } from './ucs-lib.js';
import { UcsSetup } from './ucs-setup.js';

describe('UcsLib', () => {
  describe('serializerFor', () => {
    let lib: UcsLib<{ writeValue: UcSchema.Spec<number> }>;

    beforeEach(async () => {
      lib = await new UcsSetup<{ writeValue: UcSchema.Spec<number> }>({
        schemae: { writeValue: Number },
      }).bootstrap();
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

  describe('resolver', () => {
    it('has default value', () => {
      expect(new UcsLib({ schemae: {} }).resolver).toBeDefined();
    });
  });

  describe('compileModule', () => {
    it('compiles module', async () => {
      const lib = await new UcsSetup<{ writeValue: UcSchema.Spec<number> }>({
        schemae: { writeValue: Number },
      }).bootstrap();
      const module = lib.compileModule();

      expect(module.lib).toBe(lib);
      await expect(new UccCode().write(module).toText()).resolves.toBe(await module.toText());
      await expect(module.toText()).resolves.toContain(`} from 'churi/serializer';\n`);
      await expect(module.toText()).resolves.toContain(
        'export async function writeValue(stream, value) {\n',
      );
    });
  });
});
