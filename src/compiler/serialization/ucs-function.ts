import { EsFunction, EsSnippet, EsVarSymbol, esline } from 'esgen';
import { ucModelName } from '../../schema/uc-model-name.js';
import { UcFormatName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { ucSchemaVariant } from '../impl/uc-schema-variant.js';
import { UcsExportSignature } from './ucs-export.signature.js';
import { UcsFormatterContext, UcsFormatterSignature } from './ucs-formatter.js';
import { UcsLib } from './ucs-lib.js';
import { UcsModels } from './ucs-models.js';
import { UcsWriterClass, UcsWriterSignature } from './ucs-writer.class.js';

export class UcsFunction<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #schema: TSchema;
  readonly #createWriter: Exclude<UcsFunction.Options<T, TSchema>['createWriter'], undefined>;
  readonly #formats = new Map<UcFormatName, UcsFunction$Context>();

  constructor(options: UcsFunction.Options<T, TSchema>);
  constructor({
    schema,
    createWriter = UcsFunction$createWriter,
  }: UcsFunction.Options<T, TSchema>) {
    this.#schema = schema;
    this.#createWriter = createWriter;
  }

  get schema(): TSchema {
    return this.#schema;
  }

  format(
    format: UcFormatName,
    schema: UcSchema,
    args: UcsFormatterSignature.AllValues,
    onUnknownSchema: (
      schema: UcSchema,
      context: UcsFormatterContext,
    ) => never = UcsFunction$onUnknownSchema,
  ): EsSnippet {
    return (code, scope) => {
      const context = this.#contextFor(format);
      const lib = scope.get(UcsLib);
      const serializer = lib.formatterFor(format, schema)?.(args, schema, context);

      if (serializer == null) {
        onUnknownSchema(schema, context);
      }

      code.write(serializer);
    };
  }

  exportFn(
    externalName: string,
    { format = 'charge' }: UcsModels.Entry<TSchema>,
  ): EsFunction<UcsExportSignature.Args> {
    return new EsFunction(externalName, UcsExportSignature, {
      declare: {
        at: 'exports',
        async: true,
        body:
          ({ args: { stream, value, options } }) => code => {
            const writer = new EsVarSymbol('writer');

            code
              .line(
                writer.declare({
                  value: () => this.#createWriter({ stream, options }, this),
                }),
              )
              .write(`try {`)
              .indent(esline`await ${this.#contextFor(format).fn.call({ writer, value })};`)
              .write(`} finally {`)
              .indent(esline`await ${writer}.done();`)
              .write(`}`);
          },
      },
    });
  }

  #contextFor(format: UcFormatName): UcsFunction$Context {
    let context = this.#formats.get(format);

    if (!context) {
      context = new UcsFunction$Context(this, format);
      this.#formats.set(format, context);
    }

    return context;
  }

}

export namespace UcsFunction {
  export interface Options<out T, out TSchema extends UcSchema<T>> {
    readonly schema: TSchema;

    createWriter?(this: void, args: UcsWriterSignature.Values, serializer: UcsFunction): EsSnippet;
  }
}

function UcsFunction$createWriter(args: UcsWriterSignature.Values): EsSnippet {
  return async (code, { ns }) => {
    const naming = await ns.refer(UcsWriterClass).whenNamed();

    code.line(naming.instantiate(args));
  };
}

function UcsFunction$onUnknownSchema(schema: UcSchema, context: UcsFormatterContext): never {
  throw new UnsupportedUcSchemaError(
    schema,
    `${context}: Can not serialize type "${ucModelName(schema)}"`,
  );
}

class UcsFunction$Context implements UcsFormatterContext {

  readonly #serializer: UcsFunction<unknown, UcSchema<unknown>>;
  readonly #format: UcFormatName;
  readonly #fn: EsFunction<UcsFormatterSignature.Args>;

  constructor(serializer: UcsFunction, format: UcFormatName) {
    this.#serializer = serializer;
    this.#format = format;

    const { schema } = serializer;

    this.#fn = new EsFunction(
      `${ucSchemaSymbol(serializer.schema)}$${format}${ucSchemaVariant(schema)}`,
      UcsFormatterSignature,
      {
        declare: {
          at: 'bundle',
          async: true,
          body: ({ args }) => this.format(schema, args),
        },
      },
    );
  }

  get formatName(): UcFormatName {
    return this.#format;
  }

  get fn(): EsFunction<UcsFormatterSignature.Args> {
    return this.#fn;
  }

  format(
    schema: UcSchema<unknown>,
    args: UcsFormatterSignature.AllValues,
    onUnknownSchema?:
      | ((schema: UcSchema<unknown>, context: UcsFormatterContext) => never)
      | undefined,
  ): EsSnippet {
    return this.#serializer.format(this.formatName, schema, args, onUnknownSchema);
  }

  toString(): string {
    return this.#fn.toString();
  }

}
