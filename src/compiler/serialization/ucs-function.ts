import { SERIALIZER_MODULE } from '../../impl/module-names.js';
import { ucModelName } from '../../schema/uc-model-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccSource } from '../codegen/ucc-code.js';
import { UccNamespace } from '../codegen/ucc-namespace.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { ucSchemaVariant } from '../impl/uc-schema-variant.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcsLib } from './ucs-lib.js';

export class UcsFunction<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #lib: UcsLib;
  readonly #ns: UccNamespace;
  readonly #schema: TSchema;
  readonly #name: string;
  #args?: UcsFunction.Args;
  readonly #createWriter: Exclude<UcsFunction.Options<T, TSchema>['createWriter'], undefined>;

  constructor(options: UcsFunction.Options<T, TSchema>);
  constructor({
    lib,
    schema,
    createWriter = UcsFunction$createWriter,
  }: UcsFunction.Options<T, TSchema>) {
    this.#lib = lib;
    this.#ns = lib.ns.nest();
    this.#schema = schema;
    this.#createWriter = createWriter;
    this.#name = this.#declare();
  }

  #declare(): string {
    return this.lib.declarations.declareFunction(
      `${ucSchemaSymbol(this.schema)}$serialize${ucSchemaVariant(this.schema)}`,
      [this.args.writer, this.args.value, this.args.asItem],
      () => code => {
        code.write(this.serialize(this.schema, this.args.value, this.args.asItem));
      },
      {
        async: true,
        bindArgs: {
          [this.args.writer]: this.args.writer,
          [this.args.value]: this.args.value,
          [this.args.asItem]: this.args.asItem,
        },
      },
    );
  }

  get lib(): UcsLib {
    return this.#lib;
  }

  get schema(): TSchema {
    return this.#schema;
  }

  get name(): string {
    return this.#name;
  }

  get args(): UcsFunction.Args {
    return (this.#args ??= {
      writer: this.ns.name('writer'),
      value: this.ns.name('value'),
      asItem: this.ns.name('asItem'),
    });
  }

  get ns(): UccNamespace {
    return this.#ns;
  }

  serialize(schema: UcSchema, value: string, asItem = '0'): UccSource {
    const serializer = this.lib.generatorFor(schema)?.(this, schema, value, asItem);

    if (serializer == null) {
      throw new UnsupportedUcSchemaError(schema, `Can not serialize type "${ucModelName(schema)}"`);
    }

    return serializer;
  }

  toUcSerializer(stream: string, value: string): UccSource {
    return code => {
      code
        .write(this.#createWriter(this, this.args.writer, stream))
        .write(`try {`)
        .indent(`await ${this.name}(${this.args.writer}, ${value});`)
        .write(`} finally {`)
        .indent(`await ${this.args.writer}.done();`)
        .write(`}`);
    };
  }

}

function UcsFunction$createWriter(serializer: UcsFunction, writer: string, stream: string): string {
  const UcsWriter = serializer.lib.import(SERIALIZER_MODULE, 'UcsWriter');

  return `const ${writer} = new ${UcsWriter}(${stream});`;
}

export namespace UcsFunction {
  export interface Options<out T, out TSchema extends UcSchema<T>> {
    readonly lib: UcsLib;
    readonly schema: TSchema;

    createWriter?(this: void, serializer: UcsFunction, writer: string, stream: string): UccSource;
  }

  export interface Args {
    readonly writer: string;
    readonly value: string;
    readonly asItem: string;
  }
}
