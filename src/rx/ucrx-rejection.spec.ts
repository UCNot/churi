import { describe, expect, it } from '@jest/globals';
import { ucrxTypeNames } from './ucrx-rejection.js';

describe('ucrxTypeNames', () => {
  it('handles multiple types', () => {
    expect(ucrxTypeNames(['number', 'bigint', 'null'])).toBe('number, bigint, or null');
  });
});
