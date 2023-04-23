import { describe, expect, it } from '@jest/globals';
import { UccLib } from './ucc-lib.js';

describe('UccLib', () => {
  describe('ns', () => {
    it('is created by default', () => {
      const { ns } = new TestLib();

      expect(ns).toBeDefined();
    });
  });

  class TestLib extends UccLib {}
});
