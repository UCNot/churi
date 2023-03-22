import { describe, expect, it } from '@jest/globals';
import { ucrxTypeNames } from './ucrx-errors.js';

describe('ucdTypeNames', () => {
  it('handles multiple types', () => {
    expect(ucrxTypeNames(['number', 'bigint', 'null'])).toBe('number, bigint, or null');
  });
});
