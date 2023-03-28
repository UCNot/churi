import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdLib } from '../../compiler/deserialization/ucd-lib.js';
import { readTokens } from '../../spec/read-chunks.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { UcSchema } from '../uc-schema.js';

describe('UcString deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: UcErrorInfo[];

  beforeEach(() => {
    errors = [];
  });

  let lib: UcdLib<{ readValue: UcSchema.Spec<string> }>;
  let readValue: UcDeserializer<string>;

  beforeEach(async () => {
    lib = new UcdLib({
      schemae: {
        readValue: String,
      },
    });
    ({ readValue } = await lib.compile().toDeserializers());
  });

  it('deserializes string', async () => {
    await expect(readValue(readTokens('some string'))).resolves.toBe('some string');
  });
  it('deserializes multiline string', async () => {
    await expect(readValue(readTokens('prefix\r', '\n-end(suffix'))).resolves.toBe(
      'prefix\r\n-end(suffix',
    );
    await expect(readValue(readTokens('prefix\r', '\n!end(suffix'))).resolves.toBe(
      'prefix\r\n!end(suffix',
    );
  });
  it('URI-decodes string', async () => {
    await expect(readValue(readTokens('some%20string'))).resolves.toBe('some string');
  });
  it('ignores leading and trailing whitespace', async () => {
    await expect(readValue(readTokens('  \n some string  \n '))).resolves.toBe('some string');
  });
  it('deserializes empty string', async () => {
    await expect(readValue(readTokens(''))).resolves.toBe('');
    await expect(readValue(readTokens(')'))).resolves.toBe('');
  });
  it('deserializes minus-prefixed string', async () => {
    await expect(readValue(readTokens('-a%55c'))).resolves.toBe('-aUc');
    await expect(readValue(readTokens('%2Da%55c'))).resolves.toBe('-aUc');
  });
  it('deserializes quoted string', async () => {
    await expect(readValue(readTokens("'abc"))).resolves.toBe('abc');
  });
  it('respects trailing whitespace after quoted string', async () => {
    await expect(readValue(readTokens("'abc  \n  "))).resolves.toBe('abc  \n  ');
  });
  it('deserializes balanced parentheses within quoted string', async () => {
    await expect(readValue(readTokens("'abc(def()))"))).resolves.toBe('abc(def())');
  });
  it('does not close unbalanced parentheses within quoted string', async () => {
    await expect(readValue(readTokens("'abc(def("))).resolves.toBe('abc(def(');
  });
  it('rejects map', async () => {
    await expect(readValue(readTokens('foo(bar)'), { onError })).resolves.toBeUndefined();

    expect(errors).toEqual([
      {
        code: 'unexpectedType',
        details: {
          type: 'map',
          expected: {
            types: ['string'],
          },
        },
        message: 'Unexpected map, while string expected',
      },
    ]);
  });
  it('rejects suffix', async () => {
    await expect(readValue(readTokens('$foo'), { onError })).resolves.toBeUndefined();

    expect(errors).toEqual([
      {
        code: 'unexpectedType',
        details: {
          type: 'map',
          expected: {
            types: ['string'],
          },
        },
        message: 'Unexpected map, while string expected',
      },
    ]);
  });
});