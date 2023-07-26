import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { UcdModels } from '../../compiler/deserialization/ucd-models.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcErrorInfo } from '../uc-error.js';
import { UcSchema } from '../uc-schema.js';
import { ucItMatches } from './uc-string-pattern.validator.js';
import { ucString } from './uc-string.js';

describe('ucItMatches', () => {
  let errors: UcErrorInfo[];
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };

  beforeEach(() => {
    errors = [];
  });

  it('rejects mismatching string', async () => {
    const readValue = await compile(ucString({ where: ucItMatches(/abc/u) }));

    expect(readValue('def', { onError })).toBeUndefined();
    expect(errors).toEqual([
      {
        code: 'violation',
        path: [{}],
        details: {
          constraint: 'ItMatches',
          pattern: 'abc',
          flags: 'u',
        },
        message: `String matching /abc/u pattern expected`,
      },
    ]);
  });
  it('does not reject when validation is off', async () => {
    const readValue = await compile(ucString({ where: ucItMatches(/abc/u) }), { validate: false });

    expect(readValue('def', { onError })).toBe('def');
    expect(errors).toEqual([]);
  });
  it('supports custom message', async () => {
    const readValue = await compile(ucString({ where: ucItMatches(/abc/, 'Wrong!') }));

    expect(readValue('def', { onError })).toBeUndefined();
    expect(errors).toEqual([
      {
        code: 'violation',
        path: [{}],
        details: {
          constraint: 'ItMatches',
          pattern: 'abc',
          flags: '',
        },
        message: `Wrong!`,
      },
    ]);
  });
  it('accepts matching string', async () => {
    const readValue = await compile(ucString({ where: ucItMatches(/[abc]/) }));

    expect(readValue('a')).toBe('a');
  });

  async function compile(
    schema: UcSchema<string>,
    options?: Partial<UcdCompiler.Options<UcdModels>>,
  ): Promise<UcDeserializer.Sync<string>> {
    const compiler = new UcdCompiler({
      ...options,
      models: { readValue: { model: schema, mode: 'sync' } },
    });
    const { readValue } = await compiler.evaluate();

    return readValue;
  }
});
