import { describe, expect, it } from '@jest/globals';
import { UcBundle, createUcBundle } from './uc-bundle.js';

describe('UcBundle', () => {
  it('returns the bundle itself', () => {
    const options: Omit<UcBundle, '_brand'> = {
      dist: 'test.js',
    };

    expect(createUcBundle(options)).toBe(options);
  });
});
