import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { ucdProcessPrimitives } from '../../compiler/deserialization/ucd-process-primitives.js';
import { ucdProcessPlainEntity } from '../../spec/plain.format.js';
import { parseTokens } from '../../spec/read-chunks.js';
import {
  ucdProcessTimestampFormat,
  ucdProcessTimestampFormatOnly,
} from '../../spec/timestamp.format.js';
import { UC_TOKEN_EXCLAMATION_MARK } from '../../syntax/uc-token.js';
import { UcErrorInfo } from '../uc-error.js';

describe('UcFormatted deserializer', () => {
  const onError = (error: UcErrorInfo): void => {
    errors.push(error);
  };
  let errors: unknown[];

  beforeEach(() => {
    errors = [];
  });

  it('recognizes by custom prefix', async () => {
    const compiler = new UcdCompiler({
      models: {
        readString: {
          model: String,
          mode: 'sync',
          byTokens: true,
        },
      },
      features: [ucdProcessPrimitives, ucdProcessPlainEntity],
    });
    const { readString } = await compiler.evaluate();

    expect(readString("!plain'test")).toBe("!plain'test");
  });
  it('closes hanging parentheses', async () => {
    const compiler = new UcdCompiler({
      models: {
        readString: {
          model: String,
          mode: 'async',
          byTokens: true,
        },
      },
      features: [ucdProcessPrimitives, ucdProcessPlainEntity],
    });
    const { readString } = await compiler.evaluate();

    await expect(readString(parseTokens("!plain'(bar(item1,item2)baz("))).resolves.toBe(
      "!plain'(bar(item1,item2)baz())",
    );
  });
  it('extends base ucrx', async () => {
    const compiler = new UcdCompiler({
      models: {
        readTimestamp: {
          model: Number,
          mode: 'sync',
          byTokens: true,
        },
      },
      features: [ucdProcessPrimitives, ucdProcessTimestampFormat],
    });
    const now = new Date();
    const { readTimestamp } = await compiler.evaluate();

    expect(readTimestamp(`!timestamp'${now.toISOString()}`)).toBe(now.getTime());
  });
  it('fails without required ucrx method', async () => {
    const compiler = new UcdCompiler({
      models: {
        readTimestamp: { model: Number, mode: 'sync' },
      },
      features: [ucdProcessPrimitives, ucdProcessTimestampFormatOnly],
    });

    await expect(compiler.evaluate()).rejects.toThrow(
      new ReferenceError(`.date(value, cx) is not available in VoidUcrx /* [Class] */`),
    );
  });
  it('does not recognize unknown format', async () => {
    const compiler = new UcdCompiler({
      models: {
        readNumber: {
          model: Number,
          mode: 'sync',
          byTokens: true,
        },
      },
      features: ucdProcessPrimitives,
    });

    const { readNumber } = await compiler.evaluate();

    expect(readNumber("!format'test!", { onError })).toBeUndefined();
    expect(errors).toEqual([
      {
        code: 'unrecognizedFormat',
        path: [{}],
        details: {
          format: 'format',
          data: ['test', UC_TOKEN_EXCLAMATION_MARK],
        },
        message: "Unrecognized data format: !format'test!",
      },
    ]);
  });
});
