import { describe, expect, it } from '@jest/globals';
import { URIChargeParser } from './uri-charge-parser.js';

describe('URIChargeParser', () => {
  describe('get', () => {
    it('returns default instance without options', () => {
      expect(URIChargeParser.get()).toBe(URIChargeParser.default);
    });
    it('returns new instance with options', () => {
      expect(URIChargeParser.get({})).not.toBe(URIChargeParser.default);
    });
  });
});
