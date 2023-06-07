import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdCompiler } from '../../compiler/deserialization/ucd-compiler.js';
import { ucdSupportPrimitives } from '../../compiler/deserialization/ucd-support-primitives.js';
import { readTokens } from '../../spec/read-chunks.js';
import { ucdSupportPlainEntity } from '../../spec/read-plain-entity.js';
import {
  ucdSupportTimestampEntity,
  ucdSupportTimestampEntityOnly,
} from '../../spec/timestamp.ucrx-method.js';
import { UC_TOKEN_EXCLAMATION_MARK } from '../../syntax/uc-token.js';
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
        readNumber: Number,
      },
      mode: 'async',
      features: ucdSupportPrimitives,
    });

    const { readNumber } = await compiler.evaluate();

    await expect(readNumber(readTokens('!Infinity'), { onError })).resolves.toBeUndefined();
    expect(errors).toEqual([
      {
        code: 'unrecognizedEntity',
        path: [{}],
        details: {
          entity: [UC_TOKEN_EXCLAMATION_MARK, 'Infinity'],
        },
        message: 'Unrecognized entity: !Infinity',
      },
    ]);
  });
  it('(sync) does not recognize unknown entity', async () => {
    const compiler = new UcdCompiler({
      models: {
        readNumber: Number,
      },
      mode: 'sync',
      features: ucdSupportPrimitives,
    });

    const { readNumber } = await compiler.evaluate();

    expect(readNumber('!Infinity', { onError })).toBeUndefined();
    expect(errors).toEqual([
      {
        code: 'unrecognizedEntity',
        path: [{}],
        details: {
          entity: [UC_TOKEN_EXCLAMATION_MARK, 'Infinity'],
        },
        message: 'Unrecognized entity: !Infinity',
      },
    ]);
  });

  it('recognizes by custom prefix', async () => {
    const compiler = new UcdCompiler({
      models: {
        readString: String,
      },
      mode: 'sync',
      features: [ucdSupportPrimitives, ucdSupportPlainEntity],
    });
    const { readString } = await compiler.evaluate();

    expect(readString("!plain'test")).toBe("!plain'test");
  });
  it('closes hanging parentheses', async () => {
    const compiler = new UcdCompiler({
      models: {
        readString: String,
      },
      mode: 'async',
      features: [ucdSupportPrimitives, ucdSupportPlainEntity],
    });
    const { readString } = await compiler.evaluate();

    await expect(readString(readTokens('!plain(bar(item1,item2)baz('))).resolves.toBe(
      '!plain(bar(item1,item2)baz())',
    );
  });
  it('extends base ucrx', async () => {
    const compiler = new UcdCompiler({
      models: {
        readTimestamp: Number,
      },
      mode: 'sync',
      features: [ucdSupportPrimitives, ucdSupportTimestampEntity],
    });
    const now = new Date();
    const { readTimestamp } = await compiler.evaluate();

    expect(readTimestamp(`!timestamp'${now.toISOString()}`)).toBe(now.getTime());
  });
  it('fails without required ucrx method', async () => {
    const compiler = new UcdCompiler({
      models: {
        readTimestamp: Number,
      },
      mode: 'sync',
      features: [ucdSupportPrimitives, ucdSupportTimestampEntityOnly],
    });

    await expect(compiler.evaluate()).rejects.toThrow(
      new ReferenceError(`.date(value, reject) is not available in VoidUcrx /* [Class] */`),
    );
  });
});
