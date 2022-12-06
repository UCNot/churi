import { describe, expect, it } from '@jest/globals';
import '../spec/uri-charge-matchers.js';
import { URIChargeBuilder } from './uri-charge-builder.js';

describe('URIChargeBuilder', () => {
  describe('none', () => {
    it('is "None" charge', () => {
      const none = new URIChargeBuilder().none;

      expect(none).toBeURIChargeNone();
      expect(none.at(0)).toBe(none);
      expect(none.at(1)).toBe(none);
      expect(none.at(0.1)).toBe(none);
      expect(none.get('some')).toBe(none);
      expect([...none.list()]).toHaveLength(0);
      expect([...none.entries()]).toHaveLength(0);
      expect([...none.keys()]).toHaveLength(0);
    });
  });
});
