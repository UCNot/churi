import { describe, expect, it } from '@jest/globals';
import { createUcSerializer } from './uc-serializer.js';

describe('createUcSerializer', () => {
  it('throws error', () => {
    expect(() => createUcSerializer(Number)).toThrow(
      new TypeError(
        `Can not create serializer for Number. Is "ts-transform-churi" transformer applied?`,
      ),
    );
  });
});
