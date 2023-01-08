import { describe, expect, it } from '@jest/globals';
import { UcEntity } from './uc-entity.js';

describe('UcEntity', () => {
  const entity = new UcEntity('!foo%20bar');

  it('contains raw encoded value', () => {
    expect(entity.raw).toBe('!foo%20bar');
    expect(String(entity)).toBe('!foo%20bar');
    expect(entity.toString()).toBe('!foo%20bar');
    expect(entity.valueOf()).toBe('!foo%20bar');
  });

  it('has string tag', () => {
    expect(entity[Symbol.toStringTag]).toBe('UcEntity');
  });
});
