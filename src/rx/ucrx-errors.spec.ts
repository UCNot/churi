import { describe, expect, it } from '@jest/globals';
import { ucrxExpectedTypes, ucrxTypeNames } from './ucrx-errors.js';

describe('ucrxExpectedTypes', () => {
  it('never empty', () => {
    expect(ucrxExpectedTypes({})).toEqual(['none']);
  });
});

describe('ucdTypeNames', () => {
  it('handles multiple types', () => {
    expect(ucrxTypeNames(['number', 'bigint', 'null'])).toBe('number, bigint, or null');
  });
});
