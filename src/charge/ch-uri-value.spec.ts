import { describe, expect, it } from '@jest/globals';
import { ChURIEntity } from './ch-uri-value.js';

describe('ChURIEntity', () => {
  const entity = new ChURIEntity('!foo%20bar');

  it('contains raw encoded value', () => {
    expect(entity.raw).toBe('!foo%20bar');
    expect(String(entity)).toBe('!foo%20bar');
    expect(entity.toString()).toBe('!foo%20bar');
    expect(entity.valueOf()).toBe('!foo%20bar');
  });
});
