import { describe, expect, it } from '@jest/globals';
import { createUcBundle } from './uc-bundle.js';

describe('UcBundle', () => {
  it('returns bundle representation', () => {
    expect(
      createUcBundle({
        dist: './my-bundle.js',
      }),
    ).toBeDefined();
  });
  it('returns bundle representation without config', () => {
    expect(createUcBundle()).toBeDefined();
  });
});
