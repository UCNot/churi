import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { ucdProcessPrimitives } from '../../compiler/deserialization/ucd-process-primitives.js';
import { parseTokens } from '../../spec/read-chunks.js';
import { UcErrorInfo } from '../uc-error.js';

describe('UcEntity deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: unknown[];

  beforeEach(() => {
    errors = [];
  });

  it('(async) does not recognize unknown entity', async () => {
    const compiler = new UcdCompiler({
      models: {
        readNumber: { model: Number, mode: 'async' },
      },
      features: ucdProcessPrimitives,
    });

    const { readNumber } = await compiler.evaluate();

    await expect(readNumber(parseTokens('!Infinity'), { onError })).resolves.toBeUndefined();
    expect(errors).toEqual([
      {
        code: 'unrecognizedEntity',
        path: [{}],
        details: {
          entity: 'Infinity',
        },
        message: 'Unrecognized entity: !Infinity',
      },
    ]);
  });
  it('(sync) does not recognize unknown entity', async () => {
    const compiler = new UcdCompiler({
      models: {
        readNumber: { model: Number, mode: 'sync' },
      },
      features: ucdProcessPrimitives,
    });

    const { readNumber } = await compiler.evaluate();

    expect(readNumber('!Infinity', { onError })).toBeUndefined();
    expect(errors).toEqual([
      {
        code: 'unrecognizedEntity',
        path: [{}],
        details: {
          entity: 'Infinity',
        },
        message: 'Unrecognized entity: !Infinity',
      },
    ]);
  });
});
