import { describe, expect, it } from '@jest/globals';
import { createUcSerializer } from 'churi';
import { ucString } from './string/uc-string.js';
import { createUcBundle } from './uc-bundle.js';
import { createUcDeserializer } from './uc-deserializer.js';

describe('UcBundle', () => {
  it('returns the bundle itself', () => {
    expect(
      createUcBundle({
        dist: './my-bundle.js',
        bundle() {
          return {
            readValue: createUcDeserializer(ucString()),
            writeValue: createUcSerializer(ucString()),
          };
        },
      }),
    ).toEqual({
      readValue: expect.any(Function),
      writeValue: expect.any(Function),
    });
  });
});
