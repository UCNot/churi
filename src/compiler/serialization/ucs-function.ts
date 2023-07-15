import { EsFunction, EsSnippet, EsVarSymbol, esline } from 'esgen';
import { ucModelName } from '../../schema/uc-model-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UnsupportedUcSchemaError } from '../common/unsupported-uc-schema.error.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { ucSchemaVariant } from '../impl/uc-schema-variant.js';
import { UcsExportSignature } from './ucs-export.signature.js';
import { UcsLib } from './ucs-lib.js';
import { UcsWriterClass, UcsWriterSignature } from './ucs-writer.class.js';
import { UcsSignature } from './ucs.signature.js';

export class UcsFunction<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #schema: TSchema;
  readonly #fn: EsFunction<UcsSignature.Args>;
  readonly #createWriter: Exclude<UcsFunction.Options<T, TSchema>['createWriter'], undefined>;

  constructor(options: UcsFunction.Options<T, TSchema>);
  constructor({
    schema,
    createWriter = UcsFunction$createWriter,
  }: UcsFunction.Options<T, TSchema>) {
    this.#schema = schema;
    this.#createWriter = createWriter;
    this.#fn = new EsFunction(
      `${ucSchemaSymbol(this.schema)}$serialize${ucSchemaVariant(this.schema)}`,
      UcsSignature,
      {
        declare: {
          at: 'bundle',
          async: true,
          body: ({ args }) => this.serialize(this.schema, args),
        },
      },
    );
  }

  get schema(): TSchema {
    return this.#schema;
  }

  get fn(): EsFunction<UcsSignature.Args> {
    return this.#fn;
  }

  serialize(
    schema: UcSchema,
    args: UcsSignature.AllValues,
    onUnknownSchema: (schema: UcSchema, fn: UcsFunction) => never = UcsFunction$onUnknownSchema,
  ): EsSnippet {
    return (code, scope) => {
      const lib = scope.get(UcsLib);
      const serializer = lib.generatorFor(schema)?.(this, schema, args);

      if (serializer == null) {
        onUnknownSchema(schema, this);
      }

      code.write(serializer);
    };
  }

  exportFn(
    externalName: string,
    signature: UcsExportSignature,
  ): EsFunction<UcsExportSignature.Args> {
    return new EsFunction(externalName, signature, {
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
              .indent(esline`await ${this.fn.call({ writer, value })};`)
              .write(`} finally {`)
              .indent(esline`await ${writer}.done();`)
              .write(`}`);
          },
      },
    });
  }

  toString(): string {
    return this.fn.toString();
  }

}

function UcsFunction$createWriter(args: UcsWriterSignature.Values): EsSnippet {
  return async (code, { ns }) => {
    const naming = await ns.refer(UcsWriterClass).whenNamed();

    code.line(naming.instantiate(args));
  };
}

function UcsFunction$onUnknownSchema(schema: UcSchema, fn: UcsFunction): never {
  throw new UnsupportedUcSchemaError(
    schema,
    `${fn}: Can not serialize type "${ucModelName(schema)}"`,
  );
}

export namespace UcsFunction {
  export interface Options<out T, out TSchema extends UcSchema<T>> {
    readonly schema: TSchema;

    createWriter?(this: void, args: UcsWriterSignature.Values, serializer: UcsFunction): EsSnippet;
  }
}
