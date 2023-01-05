import { SERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccAliases } from '../ucc-aliases.js';
import { UccCode } from '../ucc-code.js';
import { UnsupportedUcSchema } from '../unsupported-uc-schema.js';
import { UcsLib } from './ucs-lib.js';

export class UcsFunction<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>>
  implements UccCode.Fragment {

  readonly #lib: UcsLib;
  readonly #schema: TSchema;
  readonly #name: string;
  readonly #code = new UccCode();

  constructor(options: UcsFunction.Options<T, TSchema>);
  constructor({ lib, schema, name }: UcsFunction.Options<T, TSchema>) {
    this.#lib = lib;
    this.#schema = schema;
    this.#name = name;

    this.#schema = schema;

    this.#code.write(this.serialize(this.schema, this.args.value));
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
    return this.lib.serializerArgs;
  }

  get aliases(): UccAliases {
    return this.#lib.aliases;
  }

  serialize(schema: UcSchema, value: string): UccCode.Source {
    const serializer = this.lib.definitionsFor(schema)?.serialize(this, schema, value);

    if (serializer == null) {
      throw new UnsupportedUcSchema(
        schema,
        `${this.name}: Can not serialize type "${schema.type} from "${schema.from}"`,
      );
    }

    return serializer;
  }

  toCode(): UccCode.Builder {
    return code => code
        .write(`async function ${this.name}(${this.args.writer}, ${this.args.value}) {`)
        .indent(this.#code)
        .write('}');
  }

  toUcsSerializer(value: string): UccCode.Builder {
    const UcsWriter = this.lib.import(SERIALIZER_MODULE, 'UcsWriter');

    return code => code
        .write(`const writer = new ${UcsWriter}(stream);`)
        .write(`try {`)
        .indent(`await ${this.name}(writer, ${value});`)
        .write(`} finally {`)
        .indent(`await writer.done();`)
        .write(`}`);
  }

}

export namespace UcsFunction {
  export interface Options<out T, out TSchema extends UcSchema<T>> {
    readonly lib: UcsLib;
    readonly schema: TSchema;
    readonly name: string;
  }

  export interface Args {
    readonly writer: string;
    readonly value: string;
  }
}
