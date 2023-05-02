import { describe, expect, it } from '@jest/globals';
import { UccBundle } from './ucc-bundle.js';
import { UccLib } from './ucc-lib.js';

describe('UccLib', () => {
  describe('bundle', () => {
    it('is created by default', () => {
      expect(new UccLib().bundle).toBeInstanceOf(UccBundle);
    });
    it('accepts custom instance', () => {
      const bundle = new UccBundle();
      const lib = new UccLib({ bundle });

      expect(lib.bundle).toBe(bundle);
      expect(lib.ns).toBe(bundle.ns);
      expect(lib.imports).toBe(bundle.imports);
      expect(lib.declarations).toBe(bundle.declarations);
    });
  });
});
