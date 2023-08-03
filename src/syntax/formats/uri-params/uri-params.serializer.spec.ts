import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcSerializer } from 'churi';
import { UnsupportedUcSchemaError } from '../../../compiler/common/unsupported-uc-schema.error.js';
import { UcsCompiler } from '../../../compiler/serialization/ucs-compiler.js';
import { ucsSupportPlainText } from '../../../compiler/serialization/ucs-support-plain-text.js';
import { ucsSupportURIEncoded } from '../../../compiler/serialization/ucs-support-uri-encoded.js';
import { ucsSupportURIParams } from '../../../compiler/serialization/ucs-support-uri-params.js';
import { ucBoolean } from '../../../schema/boolean/uc-boolean.js';
import { ucMap } from '../../../schema/map/uc-map.js';
import { ucBigInt } from '../../../schema/numeric/uc-bigint.js';
import { ucInteger } from '../../../schema/numeric/uc-integer.js';
import { ucNumber } from '../../../schema/numeric/uc-number.js';
import { ucString } from '../../../schema/string/uc-string.js';
import { ucOptional } from '../../../schema/uc-optional.js';
import { TextOutStream } from '../../../spec/text-out-stream.js';
import { ucInsetPlainText } from '../plain-text/uc-inset-plain-text.js';
import { ucInsetURIEncoded } from '../uri-encoded/uc-inset-uri-encoded.js';

describe('URI params serializer', () => {
  it('serializes bigint', async () => {
    const compiler = new UcsCompiler({
      capabilities: [ucsSupportURIEncoded(), ucsSupportURIParams()],
      models: {
        writeParams: {
          model: ucMap({
            test: ucBigInt({
              string: 'serialize',
              within: {
                uriParam: ucInsetURIEncoded(),
              },
            }),
          }),
          format: 'uriParams',
        },
      },
    });

    const { writeParams } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeParams(to, { test: -13n })),
    ).resolves.toBe('test=-0n13');
  });
  it('serializes boolean', async () => {
    const compiler = new UcsCompiler({
      capabilities: [ucsSupportURIEncoded(), ucsSupportURIParams()],
      models: {
        writeParams: {
          model: ucMap({
            test: ucBoolean({
              within: {
                uriParam: ucInsetURIEncoded(),
              },
            }),
          }),
          format: 'uriParams',
        },
      },
    });

    const { writeParams } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeParams(to, { test: true })),
    ).resolves.toBe('test=!');
    await expect(
      TextOutStream.read(async to => await writeParams(to, { test: false })),
    ).resolves.toBe('test=-');
  });
  it('serializes integer', async () => {
    const compiler = new UcsCompiler({
      capabilities: [ucsSupportURIEncoded(), ucsSupportURIParams()],
      models: {
        writeParams: {
          model: ucMap({
            test: ucInteger({
              within: {
                uriParam: ucInsetURIEncoded(),
              },
            }),
          }),
          format: 'uriParams',
        },
      },
    });

    const { writeParams } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeParams(to, { test: 13.1 })),
    ).resolves.toBe('test=13');
    await expect(
      TextOutStream.read(async to => await writeParams(to, { test: -13.1 })),
    ).resolves.toBe('test=-13');
  });
  it('serializes number', async () => {
    const compiler = new UcsCompiler({
      capabilities: [ucsSupportURIEncoded(), ucsSupportURIParams()],
      models: {
        writeParams: {
          model: ucMap({
            test: ucNumber({
              within: {
                uriParam: ucInsetURIEncoded(),
              },
            }),
          }),
          format: 'uriParams',
        },
      },
    });

    const { writeParams } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeParams(to, { test: 13.1 })),
    ).resolves.toBe('test=13.1');
    await expect(
      TextOutStream.read(async to => await writeParams(to, { test: -13.1 })),
    ).resolves.toBe('test=-13.1');
  });
  it('serializes URI-encoded string', async () => {
    const compiler = new UcsCompiler({
      capabilities: [ucsSupportURIEncoded(), ucsSupportURIParams()],
      models: {
        writeParams: {
          model: ucMap({
            test: ucString({
              within: {
                uriParam: ucInsetURIEncoded(),
              },
            }),
          }),
          format: 'uriParams',
        },
      },
    });

    const { writeParams } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeParams(to, { test: '3a, b c!' })),
    ).resolves.toBe('test=3a%2C%20b%20c%21');
  });
  it('serializes plain text string', async () => {
    const compiler = new UcsCompiler({
      capabilities: [ucsSupportPlainText(), ucsSupportURIParams()],
      models: {
        writeParams: {
          model: ucMap({
            'test 1': ucString({
              within: {
                uriParam: ucInsetPlainText(),
              },
            }),
          }),
          format: 'uriParams',
        },
      },
    });

    const { writeParams } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeParams(to, { 'test 1': '3a, b c!' })),
    ).resolves.toBe('test+1=3a, b c!');
  });
  it('serializes charged string', async () => {
    const compiler = new UcsCompiler({
      capabilities: ucsSupportURIParams(),
      models: {
        writeParams: {
          model: ucMap({
            'test 2': String,
          }),
          format: 'uriParams',
        },
      },
    });

    const { writeParams } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeParams(to, { 'test 2': '3a, (b) c!' })),
    ).resolves.toBe("test+2='3a%2C+%28b%29+c%21");
  });
  it('fails to deserialize value in unknown inset format', async () => {
    const compiler = new UcsCompiler({
      capabilities: ucsSupportURIParams({ defaultInsetFormat: 'plainText' }),
      models: {
        writeParams: {
          model: ucMap({
            'test 2': String,
          }),
          format: 'uriParams',
        },
      },
    });

    await expect(compiler.evaluate()).rejects.toThrow(
      new UnsupportedUcSchemaError(
        ucString(),
        'Can not serialize inset "uriParam" of type "String"',
      ),
    );
  });

  describe('optional properties', () => {
    let writeParams: UcSerializer<{
      test?: string | undefined;
      test2?: string | undefined;
    }>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        capabilities: [ucsSupportURIEncoded(), ucsSupportURIParams()],
        models: {
          writeParams: {
            model: ucMap({
              test: ucOptional(
                ucString({
                  within: {
                    uriParam: ucInsetURIEncoded(),
                  },
                }),
              ),
              test2: ucOptional(
                ucString({
                  within: {
                    uriParam: ucInsetURIEncoded(),
                  },
                }),
              ),
            }),
            format: 'uriParams',
          },
        },
      });

      ({ writeParams } = await compiler.evaluate());
    });

    it('writes value', async () => {
      await expect(
        TextOutStream.read(async to => await writeParams(to, { test: 'abc', test2: 'def' })),
      ).resolves.toBe('test=abc&test2=def');
    });
    it('skips missing value', async () => {
      await expect(
        TextOutStream.read(async to => await writeParams(to, { test2: 'abc' })),
      ).resolves.toBe('test2=abc');
    });
    it('skips undefined value', async () => {
      await expect(
        TextOutStream.read(async to => await writeParams(to, { test: 'abc', test2: undefined })),
      ).resolves.toBe('test=abc');
    });
  });
});
