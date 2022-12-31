import { UcSchema } from '../../schema/uc-schema.js';
import { UccAliases } from '../ucc-aliases.js';
import { UccCode } from '../ucc-code.js';
import { UccDeclarations } from '../ucc-declarations.js';
import { UnsupportedUcSchema } from '../unsupported-uc-schema.js';
import { UcsDefs } from './ucs-defs.js';
import { UcsLib } from './ucs-lib.js';

export class UcsFunction<
  out T = unknown,
  out TSchema extends UcSchema<T> = UcSchema<T>,
> extends UccCode {

  readonly #lib: UcsLib;
  readonly #schema: TSchema;
  readonly #name: string;
  readonly #declarations: UccDeclarations;

  constructor(options: UcsFunction.Options<T, TSchema>);
  constructor({ lib, schema, name }: UcsFunction.Options<T, TSchema>) {
    super();

    this.#lib = lib;
    this.#schema = schema;
    this.#name = name;

    this.#declarations = new UccDeclarations(this.aliases);
    this.#schema = schema;

    this.write(this.declarations);
    this.write(code => this.serializerFor(this.schema)(code, this.args.value));
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

  get declarations(): UccDeclarations {
    return this.#declarations;
  }

  declare(name: string, code: string): string {
    return this.declarations.declare(name, code);
  }

  serializerFor(schema: UcSchema): UcsDefs.Serializer {
    const serializer = this.lib.definitionsFor(schema)?.serialize(this, schema);

    if (!serializer) {
      throw new UnsupportedUcSchema(
        schema,
        `${this.name}: Can not serialize type "${schema.type} from "${schema.from}"`,
      );
    }

    return serializer;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async toCode(code: UccCode): Promise<void> {
    code
      .write(`async function ${this.name}(${this.args.writer}, ${this.args.value}) {`)
      .indent(code => {
        code.write(super.toCode.bind(this));
      })
      .write('}');
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
