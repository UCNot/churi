import { describe, expect, it } from '@jest/globals';
import { createUcSerializer } from './uc-serializer.js';

describe('createUcSerializer', () => {
  it('creates failing serializer', () => {
    expect(() => createUcSerializer(Number)(null!, null!)).toThrow(
      new TypeError(`Can not serialize Number. Is "ts-transformer-churi" applied?`),
    );
  });
});
