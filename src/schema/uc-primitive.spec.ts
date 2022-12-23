import { describe, expect, it } from '@jest/globals';
import { UcBigInt, UcBoolean, UcNumber, UcString } from './uc-primitive.js';
import { UC_DATA_ENCODED } from './uc-schema.js';

describe('UcBigInt', () => {
  it('is defined', () => {
    expect(UcBigInt).toMatchObject({
      from: '@hatsy/churi',
      type: 'bigint',
    });
  });
});

describe('UcBoolean', () => {
  it('is defined', () => {
    expect(UcBoolean).toMatchObject({
      from: '@hatsy/churi',
      type: 'boolean',
    });
  });
});

describe('UcNumber', () => {
  it('is defined', () => {
    expect(UcNumber).toMatchObject({
      from: '@hatsy/churi',
      type: 'number',
    });
  });
});

describe('UcString', () => {
  it('is defined', () => {
    expect(UcString).toMatchObject({
      from: '@hatsy/churi',
      type: 'string',
      flags: UC_DATA_ENCODED,
    });
  });
});
