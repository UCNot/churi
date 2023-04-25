import { describe, expect, it } from '@jest/globals';
import { createUcDeserializer } from './uc-deserializer.js';

describe('createUcDeserializer', () => {
  it('creates failing deserializer', () => {
    expect(() => createUcDeserializer(Number)('123')).toThrow(
      new TypeError(`Can not deserialize Number. Is "ts-transform-churi" transformer applied?`),
    );
  });
});
