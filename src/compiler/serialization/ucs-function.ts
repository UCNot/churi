import { SERIALIZER_MODULE } from '../../impl/module-names.js';
import { ucSchemaName } from '../../schema/uc-schema-name.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UccNamespace } from '../ucc-namespace.js';
import { UnsupportedUcSchemaError } from '../unsupported-uc-schema.error.js';
import { UcsLib } from './ucs-lib.js';

export class UcsFunction<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>>
  implements UccCode.Fragment {

  readonly #lib: UcsLib;
  readonly #ns: UccNamespace;
  readonly #schema: TSchema;
  readonly #name: string;
  #args?: UcsFunction.Args;
  readonly #createWriter: Required<UcsFunction.Options<T, TSchema>>['createWriter'];

  constructor(options: UcsFunction.Options<T, TSchema>);
  constructor({
    lib,
    schema,
    name,
    createWriter = UcsFunction$createWriter,
  }: UcsFunction.Options<T, TSchema>) {
    this.#lib = lib;
    this.#ns = lib.ns.nest();
    this.#schema = schema;
    this.#name = name;
    this.#createWriter = createWriter;
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

  serialize(schema: UcSchema, value: string, asItem = '0'): UccCode.Source {
    const serializer = this.lib.definitionFor(schema)?.serialize(this, schema, value, asItem);

    if (serializer == null) {
      throw new UnsupportedUcSchemaError(
        schema,
        `${this.name}: Can not serialize type "${ucSchemaName(schema)}"`,
      );
    }

    return serializer;
  }

  toCode(): UccCode.Source {
    return code => code
        .write(
          `async function ${this.name}(${this.args.writer}, ${this.args.value}, ${this.args.asItem}) {`,
        )
        .indent(this.serialize(this.schema, this.args.value, this.args.asItem))
        .write('}');
  }

  toUcSerializer(stream: string, value: string): UccCode.Source {
    return code => code
        .write(this.#createWriter(this, this.args.writer, stream))
        .write(`try {`)
        .indent(`await ${this.name}(${this.args.writer}, ${value});`)
        .write(`} finally {`)
        .indent(`await ${this.args.writer}.done();`)
        .write(`}`);
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
    readonly name: string;

    createWriter?(
      this: void,
      serializer: UcsFunction,
      writer: string,
      stream: string,
    ): UccCode.Source;
  }

  export interface Args {
    readonly writer: string;
    readonly value: string;
    readonly asItem: string;
  }
}
