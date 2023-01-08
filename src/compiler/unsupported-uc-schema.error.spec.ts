import { describe, expect, it } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { UnsupportedUcSchemaError } from './unsupported-uc-schema.error.js';

describe('UnsupportedUcSchemaError', () => {
  describe('message', () => {
    it('set to default', () => {
      expect(
        new UnsupportedUcSchemaError({ from: 'test-lib', type: 'test-type', asis }).message,
      ).toBe('Unsupported type "test-type" from "test-lib"');
    });
  });

  describe('name', () => {
    it('set to error name', () => {
      expect(new UnsupportedUcSchemaError({ from: 'test-lib', type: 'test-type', asis }).name).toBe(
        'UnsupportedUcSchemaError',
      );
    });
  });
});
