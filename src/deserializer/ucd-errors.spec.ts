import { describe, expect, it } from '@jest/globals';
import { ucdExpectedTypes, ucdTypeNames } from './ucd-errors.js';

describe('ucdExpectedTypes', () => {
  it('never empty', () => {
    expect(ucdExpectedTypes({ _: {} })).toEqual(['value']);
  });
});

describe('ucdTypeNames', () => {
  it('handles multiple types', () => {
    expect(ucdTypeNames(['number', 'bigint', 'null'])).toBe('number, bigint, or null');
  });
});
