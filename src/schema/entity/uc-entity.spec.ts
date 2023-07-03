import { describe, expect, it } from '@jest/globals';
import { UcEntity } from './uc-entity.js';

describe('UcEntity', () => {
  it('has string tag', () => {
    expect(new UcEntity('test')[Symbol.toStringTag]).toBe('UcEntity');
  });

  describe('toString', () => {
    it('builds string representation', () => {
      expect(new UcEntity('test!').toString()).toBe('!test%21');
    });
  });
});
