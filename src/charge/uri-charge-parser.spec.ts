import { describe, expect, it } from '@jest/globals';
import { createURIChargeParser } from './uri-charge-parser.js';

describe('createURIChargeParser', () => {
  describe('get', () => {
    it('returns default instance without options', () => {
      expect(createURIChargeParser()).toBe(createURIChargeParser());
    });
    it('returns new instance with options', () => {
      expect(createURIChargeParser({})).not.toBe(createURIChargeParser());
    });
  });
});
