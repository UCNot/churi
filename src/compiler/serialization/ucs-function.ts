import { EsFunction, EsSnippet, EsVarSymbol, esline } from 'esgen';
import { ucModelName } from '../../schema/uc-model-name.js';
import { UcFormatName, UcInsetName } from '../../schema/uc-presentations.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { ucSchemaVariant } from '../impl/uc-schema-variant.js';
import { UcsExportSignature } from './ucs-export.signature.js';
import { UcsFormatter, UcsFormatterContext, UcsFormatterSignature } from './ucs-formatter.js';
import { UcsLib } from './ucs-lib.js';
import { UcsModels } from './ucs-models.js';
import { CreateUcsWriterExpr, UcsWriterClass, UcsWriterSignature } from './ucs-writer.class.js';

export class UcsFunction<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #schema: TSchema;
  readonly #createWriterFor: UcsFunction.Options<T, TSchema>['createWriterFor'];
  readonly #formats = new Map<
    UcFormatName | `${UcInsetName}(${UcFormatName})`,
    UcsFunction$Context
  >();

  constructor(options: UcsFunction.Options<T, TSchema>);
  constructor({ schema, createWriterFor }: UcsFunction.Options<T, TSchema>) {
    this.#schema = schema;
    this.#createWriterFor = createWriterFor;
  }

  get schema(): TSchema {
    return this.#schema;
  }

  format(
    {
      format,
      inset,
      hostFormat,
    }:
      | {
          format: UcFormatName;
          inset?: undefined;
          hostFormat?: undefined;
        }
      | {
          format?: undefined;
          inset: UcInsetName;
          hostFormat: UcFormatName;
        },
    schema: UcSchema,
    args: UcsFormatterSignature.AllValues,
    onUnknownSchema: (
      schema: UcSchema,
      context: UcsFormatterContext,
    ) => never = UcsFunction$onUnknownSchema,
    onUnknownInset: (schema: UcSchema, inset: UcInsetName) => never = UcsFunction$onUnknownInset,
  ): EsSnippet {
    return (code, scope) => {
      const lib = scope.get(UcsLib);
      let context: UcsFunction$Context;
      let formatter: UcsFormatter | undefined;

      if (inset) {
        const insetFormatter = lib.findInsetFormatter({
          hostFormat,
          hostSchema: this.schema,
          insetName: inset,
          insetSchema: schema,
        });

        if (!insetFormatter) {
          onUnknownInset(schema, inset);
        }

        context = this.#contextFor(insetFormatter.insetFormat, inset);
        formatter = insetFormatter.format;
      } else {
        context = this.#contextFor(format);
        formatter = lib.findFormatter(format, schema);
      }

      const write = formatter?.(args, schema, context);

      if (write == null) {
        onUnknownSchema(schema, context);
      }

      code.write(write);
    };
  }

  exportFn(
    request: UcsFunction.ExportRequest,
    entry: UcsModels.Entry<TSchema>,
  ): EsFunction<UcsExportSignature.Args>;

  exportFn(
    { externalName, format = 'charge' }: UcsFunction.ExportRequest,
    _entry: UcsModels.Entry<TSchema>,
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
                writer.const({
                  value: () => (this.#createWriterFor?.(format) ?? UcsFunction$createWriter)(
                      { stream, options },
                      this,
                    ),
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

  #contextFor(format: UcFormatName, inset?: UcInsetName): UcsFunction$Context {
    const id = inset ? (`${inset}(${format})` as const) : format;
    let context = this.#formats.get(id);

    if (!context) {
      context = new UcsFunction$Context(this, format);
      this.#formats.set(id, context);
    }

    return context;
  }

}

export namespace UcsFunction {
  export interface Options<out T, out TSchema extends UcSchema<T>> {
    readonly schema: TSchema;

    createWriterFor?: ((format: UcFormatName) => CreateUcsWriterExpr | undefined) | undefined;
  }

  export interface ExportRequest {
    readonly externalName: string;
    readonly format?: UcFormatName | undefined;
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

function UcsFunction$onUnknownInset(schema: UcSchema, inset: UcInsetName): never {
  throw new UnsupportedUcSchemaError(
    schema,
    `Can not serialize inset "${inset}" of type "${ucModelName(schema)}"`,
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
    schema: UcSchema,
    args: UcsFormatterSignature.AllValues,
    onUnknownSchema?:
      | ((schema: UcSchema<unknown>, context: UcsFormatterContext) => never)
      | undefined,
  ): EsSnippet {
    return this.#serializer.format({ format: this.formatName }, schema, args, onUnknownSchema);
  }

  formatInset(
    inset: UcInsetName,
    schema: UcSchema,
    args: UcsFormatterSignature.AllValues,
    onUnknownInset?: (schema: UcSchema, inset: UcInsetName) => never,
    onUnknownSchema?: (schema: UcSchema<unknown>, context: UcsFormatterContext) => never,
  ): EsSnippet {
    return this.#serializer.format(
      { inset, hostFormat: this.formatName },
      schema,
      args,
      onUnknownSchema,
      onUnknownInset,
    );
  }

  toString(): string {
    return this.#fn.toString();
  }

}
