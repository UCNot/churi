import { describe, expect, it } from '@jest/globals';
import { ucInsetPlainText } from 'churi';
import { esline } from 'esgen';
import { SPEC_MODULE } from '../../impl/module-names.js';
import { ucMap } from '../../schema/map/uc-map.js';
import { ucString } from '../../schema/string/uc-string.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { ucsWriteAsIs } from '../../serializer/ucs-write-asis.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import {
  UcsProcessNumberWithRadix,
  UcsProcessRadixNumber,
} from '../../spec/write-uc-radix-number.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UcsCompiler } from './ucs-compiler.js';
import { UcsInsetContext, UcsInsetFormatter } from './ucs-inset-formatter.js';
import { ucsProcessDefaults } from './ucs-process-defaults.js';
import { ucsProcessURIParams } from './ucs-process-uri-params.js';
import { ucsSupportPlainText } from './ucs-support-plain-text.js';

describe('UcsCompiler', () => {
  it('respects custom serializer', async () => {
    const compiler = new UcsCompiler({
      models: { writeValue: { model: Number } },
      features: UcsProcessNumberWithRadix,
    });

    const { writeValue } = await compiler.evaluate();

    await expect(TextOutStream.read(async to => await writeValue(to, 128))).resolves.toBe('0x80');
    await expect(
      TextOutStream.read(async to => await writeValue(to, 128, { data: { radix: 10 } })),
    ).resolves.toBe('128');
  });

  describe('generate', () => {
    it('generates module', async () => {
      const compiler = new UcsCompiler({
        models: { writeValue: { model: Number } },
      });
      const module = await compiler.generate();

      expect(module).toContain(`} from 'churi/serializer.js';\n`);
      expect(module).toContain(
        `
export async function writeValue(stream, value, options) {
`.trimStart(),
      );
    });
    it('fails to serialize unknown schema', async () => {
      const compiler = new UcsCompiler({
        models: { writeValue: { model: { type: 'test-type' } } },
        features: UcsProcessRadixNumber,
      });

      await expect(compiler.generate()).rejects.toThrow(
        `test_x2D_type$charge(writer, value, asItem?): Can not serialize type "test-type"`,
      );
    });
  });

  describe('schema constraints', () => {
    it('enables serializer feature', async () => {
      const schema: UcSchema<number> = {
        type: 'radixNumber',
        where: {
          serializer: {
            use: 'UcsProcessRadixNumber',
            from: SPEC_MODULE,
          },
        },
      };

      const compiler = new UcsCompiler({
        models: { writeValue: { model: schema } },
      });
      const { writeValue } = await compiler.evaluate();

      await expect(TextOutStream.read(async to => await writeValue(to, 128))).resolves.toBe('0x80');
    });
    it('enables schema serializer feature', async () => {
      const schema: UcSchema<number> = {
        type: 'hexNumber',
        where: {
          serializer: {
            use: 'UcsProcessRadixNumberSchema',
            from: SPEC_MODULE,
          },
        },
      };

      const compiler = new UcsCompiler({
        models: { writeValue: { model: schema } },
      });
      const { writeValue } = await compiler.evaluate();

      await expect(TextOutStream.read(async to => await writeValue(to, 128))).resolves.toBe('0x80');
    });
  });

  describe('insets', () => {
    it('allows to modify per-schema insets', async () => {
      const schema = ucMap({
        test: String,
      });
      const compiler = new UcsCompiler({
        features: [
          ucsProcessDefaults,
          ucsProcessURIParams,
          boot => {
            boot.modifyInsets(
              'uriParams',
              schema,
              <T, TSchema extends UcSchema<T>>({
                lib,
                insetSchema,
                formatter,
              }: UcsInsetContext<T, TSchema>): UcsInsetFormatter<T, TSchema> | undefined => {
                const format = formatter?.format ?? lib.findFormatter('charge', insetSchema);

                if (!format) {
                  return;
                }

                return {
                  insetFormat: 'charge',
                  format(args, schema, context) {
                    const writeKey = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);
                    const { writer } = args;

                    return code => {
                      code
                        .write(esline`await ${writeKey}(${writer}, '(test)=');`)
                        .write(format(args, schema, context));
                    };
                  },
                };
              },
            );
          },
        ],
        models: {
          writeParams: {
            model: schema,
            format: 'uriParams',
          },
        },
      });

      const { writeParams } = await compiler.evaluate();

      await expect(
        TextOutStream.read(async to => await writeParams(to, { test: '3a, (b) c!' })),
      ).resolves.toBe("(test)='3a%2C+%28b%29+c%21");
    });
    it('allows to modify per-format insets', async () => {
      const compiler = new UcsCompiler({
        features: [
          ucsProcessDefaults,
          boot => {
            boot
              .formatWith('uriParams', 'map', ({ writer, value }, _schema, cx) => code => {
                code.write(
                  cx.formatInset('uriParam', ucString(), {
                    writer,
                    value: esline`${value}.test`,
                    asItem: '0',
                  }),
                );
              })
              .modifyInsets(
                'uriParams',
                <T, TSchema extends UcSchema<T>>({
                  lib,
                  insetSchema,
                  formatter,
                }: UcsInsetContext<T, TSchema>): UcsInsetFormatter<T, TSchema> | undefined => {
                  const format = formatter?.format ?? lib.findFormatter('charge', insetSchema);

                  if (!format) {
                    return;
                  }

                  return {
                    insetFormat: 'charge',
                    format(args, schema, context) {
                      const writeKey = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);
                      const { writer } = args;

                      return code => {
                        code
                          .write(esline`await ${writeKey}(${writer}, '(test)=');`)
                          .write(format(args, schema, context));
                      };
                    },
                  };
                },
              );
          },
        ],
        models: {
          writeParams: {
            model: ucMap({
              test: String,
            }),
            format: 'uriParams',
          },
        },
      });

      const { writeParams } = await compiler.evaluate();

      await expect(
        TextOutStream.read(async to => await writeParams(to, { test: '3a, (b) c!' })),
      ).resolves.toBe("(test)='3a%2C %28b%29 c!");
    });
  });
  it('allows to define inset format', async () => {
    const compiler = new UcsCompiler({
      features: [
        ucsProcessDefaults,
        ucsSupportPlainText(),
        boot => {
          boot.formatWith('uriParams', 'map', ({ writer, value }, _schema, cx) => code => {
            code.write(
              cx.formatInset('uriParam', ucString(), {
                writer,
                value: esline`${value}.test`,
                asItem: '0',
              }),
            );
          });
        },
      ],
      models: {
        writeParams: {
          model: ucMap({
            test: ucString({
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
      TextOutStream.read(async to => await writeParams(to, { test: '3a, (b) c!' })),
    ).resolves.toBe('3a, (b) c!');
  });
});
