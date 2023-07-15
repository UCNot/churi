import { describe, expect, it } from '@jest/globals';
import { UnsupportedUcSchemaError } from './unsupported-uc-schema.error.js';

describe('UnsupportedUcSchemaError', () => {
  describe('message', () => {
    it('set to default', () => {
      expect(new UnsupportedUcSchemaError({ type: 'test-type' }).message).toBe(
        'Unsupported type "test-type"',
      );
    });
  });

  describe('name', () => {
    it('set to error name', () => {
      expect(new UnsupportedUcSchemaError({ type: 'test-type' }).name).toBe(
        'UnsupportedUcSchemaError',
      );
    });
  });
});
