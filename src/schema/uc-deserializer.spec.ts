import { describe, expect, it } from '@jest/globals';
import { createUcDeserializer } from './uc-deserializer.js';

describe('createUcDeserializer', () => {
  it('throws error', () => {
    expect(() => createUcDeserializer(Number)).toThrow(
      new TypeError(
        `Can not create deserializer for Number. Is "ts-transform-churi" transformer applied?`,
      ),
    );
  });
});
