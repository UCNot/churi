import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { ucdSupportPrimitives } from '../../compiler/deserialization/ucd-support-primitives.js';
import { ucdSupportPlainEntity } from '../../spec/plain.format.js';
import { readTokens } from '../../spec/read-chunks.js';
import {
  ucdSupportTimestampFormat,
  ucdSupportTimestampFormatOnly,
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
        readString: ['sync', String],
      },
      features: [ucdSupportPrimitives, ucdSupportPlainEntity],
    });
    const { readString } = await compiler.evaluate();

    expect(readString("!plain'test")).toBe("!plain'test");
  });
  it('closes hanging parentheses', async () => {
    const compiler = new UcdCompiler({
      models: {
        readString: ['async', String],
      },
      features: [ucdSupportPrimitives, ucdSupportPlainEntity],
    });
    const { readString } = await compiler.evaluate();

    await expect(readString(readTokens("!plain'(bar(item1,item2)baz("))).resolves.toBe(
      "!plain'(bar(item1,item2)baz())",
    );
  });
  it('extends base ucrx', async () => {
    const compiler = new UcdCompiler({
      models: {
        readTimestamp: ['sync', Number],
      },
      features: [ucdSupportPrimitives, ucdSupportTimestampFormat],
    });
    const now = new Date();
    const { readTimestamp } = await compiler.evaluate();

    expect(readTimestamp(`!timestamp'${now.toISOString()}`)).toBe(now.getTime());
  });
  it('fails without required ucrx method', async () => {
    const compiler = new UcdCompiler({
      models: {
        readTimestamp: ['sync', Number],
      },
      features: [ucdSupportPrimitives, ucdSupportTimestampFormatOnly],
    });

    await expect(compiler.evaluate()).rejects.toThrow(
      new ReferenceError(`.date(value, cx) is not available in VoidUcrx /* [Class] */`),
    );
  });
  it('does not recognize unknown format', async () => {
    const compiler = new UcdCompiler({
      models: {
        readNumber: ['sync', Number],
      },
      features: ucdSupportPrimitives,
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
