import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { UcSchema } from '../uc-schema.js';
import { ucMatch } from './uc-string-pattern.validator.js';
import { ucString } from './uc-string.js';

describe('ucMatch', () => {
  let errors: UcErrorInfo[];
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };

  it('rejects mismatching string', async () => {
    const readValue = await compile(ucString({ where: ucMatch(/abc/u) }));

    expect(readValue('def', { onError })).toBeUndefined();
    expect(errors).toEqual([
      {
        code: 'patternMismatch',
        path: [{}],
        details: {
          pattern: 'abc',
          flags: 'u',
        },
        message: `String matching /abc/u pattern expected`,
      },
    ]);
  });
  it('supports custom message', async () => {
    const readValue = await compile(ucString({ where: ucMatch(/abc/, 'Wrong!') }));

    expect(readValue('def', { onError })).toBeUndefined();
    expect(errors).toEqual([
      {
        code: 'patternMismatch',
        path: [{}],
        details: {
          pattern: 'abc',
          flags: '',
        },
        message: `Wrong!`,
      },
    ]);
  });
  it('accepts matching string', async () => {
    const readValue = await compile(ucString({ where: ucMatch(/[abc]/) }));

    expect(readValue('a')).toBe('a');
  });

  beforeEach(() => {
    errors = [];
  });

  async function compile(schema: UcSchema<string>): Promise<UcDeserializer.Sync<string>> {
    const compiler = new UcdCompiler({ models: { readValue: schema }, mode: 'sync' });
    const { readValue } = await compiler.evaluate();

    return readValue;
  }
});
