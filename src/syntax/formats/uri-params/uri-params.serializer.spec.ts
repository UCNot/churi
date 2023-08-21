import { beforeAll, describe, expect, it } from '@jest/globals';
import { UcSerializer } from 'churi';
import { UnsupportedUcSchemaError } from '../../../compiler/common/unsupported-uc-schema.error.js';
import { UcsCompiler } from '../../../compiler/serialization/ucs-compiler.js';
import { ucsProcessDefaults } from '../../../compiler/serialization/ucs-process-defaults.js';
import { ucsProcessURIEncoded } from '../../../compiler/serialization/ucs-process-uri-encoded.js';
import { ucBoolean } from '../../../schema/boolean/uc-boolean.js';
import { ucList } from '../../../schema/list/uc-list.js';
import { ucMap } from '../../../schema/map/uc-map.js';
import { ucBigInt } from '../../../schema/numeric/uc-bigint.js';
import { ucInteger } from '../../../schema/numeric/uc-integer.js';
import { ucNumber } from '../../../schema/numeric/uc-number.js';
import { ucString } from '../../../schema/string/uc-string.js';
import { ucOptional } from '../../../schema/uc-optional.js';
import { TextOutStream } from '../../../spec/text-out-stream.js';
import { ucFormatCharge } from '../charge/uc-format-charge.js';
import { ucFormatPlainText } from '../plain-text/uc-format-plain-text.js';
import { ucFormatURIEncoded } from '../uri-encoded/uc-format-uri-encoded.js';
import { ucFormatURIParams } from './uc-format-uri-params.js';

describe('URI params serializer', () => {
  it('serializes bigint', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeParams: {
          model: ucMap(
            {
              test: ucBigInt({
                string: 'serialize',
                within: {
                  uriParam: ucFormatURIEncoded(),
                },
              }),
            },
            {
              where: ucFormatURIParams(),
            },
          ),
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
      models: {
        writeParams: {
          model: ucMap(
            {
              test: ucBoolean({
                within: {
                  uriParam: ucFormatURIEncoded(),
                },
              }),
            },
            {
              where: ucFormatURIParams(),
            },
          ),
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
      models: {
        writeParams: {
          model: ucMap(
            {
              test: ucInteger({
                within: {
                  uriParam: ucFormatURIEncoded(),
                },
              }),
            },
            {
              where: ucFormatURIParams(),
            },
          ),
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
      models: {
        writeParams: {
          model: ucMap(
            {
              test: ucNumber({
                within: {
                  uriParam: ucFormatURIEncoded(),
                },
              }),
            },
            {
              where: ucFormatURIParams(),
            },
          ),
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
      models: {
        writeParams: {
          model: ucMap(
            {
              test: ucString({
                within: {
                  uriParam: ucFormatURIEncoded(),
                },
              }),
            },
            {
              where: ucFormatURIParams(),
            },
          ),
        },
      },
    });

    const { writeParams } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeParams(to, { test: '3a, b c!' })),
    ).resolves.toBe('test=3a%2C+b+c%21');
  });
  it('serializes plain text string', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeParams: {
          model: ucMap(
            {
              'test 1': ucString({
                within: {
                  uriParam: ucFormatPlainText(),
                },
              }),
            },
            {
              where: ucFormatURIParams(),
            },
          ),
        },
      },
    });

    const { writeParams } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeParams(to, { 'test 1': '3a, b c!' })),
    ).resolves.toBe('test+1=3a, b c!');
  });
  it('serializes charged string by default', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeParams: {
          model: ucMap(
            {
              'test 2': String,
            },
            {
              where: ucFormatURIParams(),
            },
          ),
        },
      },
    });

    const { writeParams } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeParams(to, { 'test 2': '3a, (b) c!' })),
    ).resolves.toBe("test+2='3a%2C+%28b%29+c%21");
  });
  it('serializes charged string explicitly', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeParams: {
          model: ucMap(
            {
              'test 2': ucString({
                within: {
                  uriParam: ucFormatCharge(),
                },
              }),
            },
            {
              where: ucFormatURIParams(),
            },
          ),
        },
      },
    });

    const { writeParams } = await compiler.evaluate();

    await expect(
      TextOutStream.read(async to => await writeParams(to, { 'test 2': '3a, (b) c!' })),
    ).resolves.toBe("test+2='3a%2C+%28b%29+c%21");
  });
  it('fails to serialize value in unknown inset format', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeParams: {
          model: ucMap(
            {
              test: String,
            },
            {
              where: ucFormatURIParams({ paramFormat: 'plainText' }),
            },
          ),
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
  it('fails to serialize list item in unknown inset format', async () => {
    const compiler = new UcsCompiler({
      models: {
        writeParams: {
          model: ucMap(
            {
              test: ucList(String),
            },
            {
              where: ucFormatURIParams({ paramFormat: 'plainText' }),
            },
          ),
        },
      },
    });

    await expect(compiler.evaluate()).rejects.toThrow(
      new UnsupportedUcSchemaError(
        ucString(),
        'Can not serialize inset "uriParam" of type "String[]"',
      ),
    );
  });

  describe('with optional properties', () => {
    let writeParams: UcSerializer<{
      test?: string | undefined;
      test2?: string | undefined;
    }>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        models: {
          writeParams: {
            model: ucMap(
              {
                test: ucOptional(
                  ucString({
                    within: {
                      uriParam: ucFormatURIEncoded(),
                    },
                  }),
                ),
                test2: ucOptional(
                  ucString({
                    within: {
                      uriParam: ucFormatURIEncoded(),
                    },
                  }),
                ),
              },
              {
                where: ucFormatURIParams(),
              },
            ),
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

  describe('for list', () => {
    let writeParams: UcSerializer<{
      test: string[];
    }>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        features: [ucsProcessDefaults, ucsProcessURIEncoded],
        models: {
          writeParams: {
            model: ucMap(
              {
                test: ucList(String),
              },
              {
                where: ucFormatURIParams({ paramFormat: 'uriEncoded' }),
              },
            ),
          },
        },
      });

      ({ writeParams } = await compiler.evaluate());
    });

    it('serializes list', async () => {
      await expect(
        TextOutStream.read(async to => await writeParams(to, { test: ['a b', '2 3', '4 5'] })),
      ).resolves.toBe('test=a+b&test=2+3&test=4+5');
    });
    it('serializes empty list', async () => {
      await expect(
        TextOutStream.read(async to => await writeParams(to, { test: [] })),
      ).resolves.toBe('');
    });
  });

  describe('for matrix', () => {
    let writeParams: UcSerializer<{
      test: string[];
    }>;

    beforeAll(async () => {
      const compiler = new UcsCompiler({
        features: [ucsProcessDefaults, ucsProcessURIEncoded],
        models: {
          writeParams: {
            model: ucMap(
              {
                test: ucList(String),
              },
              {
                where: ucFormatURIParams({ splitter: ';', paramFormat: 'uriEncoded' }),
              },
            ),
          },
        },
      });

      ({ writeParams } = await compiler.evaluate());
    });

    it('serializes list', async () => {
      await expect(
        TextOutStream.read(async to => await writeParams(to, { test: ['a b', '2 3', '4 5'] })),
      ).resolves.toBe('test=a+b;test=2+3;test=4+5');
    });
    it('serializes empty list', async () => {
      await expect(
        TextOutStream.read(async to => await writeParams(to, { test: [] })),
      ).resolves.toBe('');
    });
  });

  describe('extra entries', () => {
    it('serializes map with extra entries only', async () => {
      const compiler = new UcsCompiler({
        models: {
          writeParams: {
            model: ucMap(
              {},
              {
                extra: ucNumber(),
                where: ucFormatURIParams(),
              },
            ),
          },
        },
      });
      const { writeParams } = await compiler.evaluate();

      await expect(
        TextOutStream.read(async to => await writeParams(to, { test1: 1, test2: 2 })),
      ).resolves.toBe('test1=1&test2=2');
    });
    it('serializes map with extra entries following explicit ones', async () => {
      const compiler = new UcsCompiler({
        models: {
          writeParams: {
            model: ucMap(
              {
                first: ucString(),
              },
              {
                extra: ucNumber(),
                where: ucFormatURIParams(),
              },
            ),
          },
        },
      });
      const { writeParams } = await compiler.evaluate();

      await expect(
        TextOutStream.read(
          async to => await writeParams(to, { first: 'test', test1: 1, test2: 2 }),
        ),
      ).resolves.toBe('first=test&test1=1&test2=2');
    });
    it('serializes optional extra entries', async () => {
      const compiler = new UcsCompiler({
        models: {
          writeParams: {
            model: ucMap(
              {},
              {
                extra: ucOptional(ucNumber()),
                where: ucFormatURIParams(),
              },
            ),
          },
        },
      });
      const { writeParams } = await compiler.evaluate();

      await expect(
        TextOutStream.read(
          async to => await writeParams(to, { first: undefined, test1: 1, test2: 2 }),
        ),
      ).resolves.toBe('test1=1&test2=2');
    });
  });
});
