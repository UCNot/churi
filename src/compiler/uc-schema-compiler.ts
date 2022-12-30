import { UcSchema } from '../schema/uc-schema.js';
import { UcCodeAliases } from './uc-code-aliases.js';
import { UcCodeBuilder } from './uc-code-builder.js';
import { UcCodeDeclarations } from './uc-code-declarations.js';
import { UcLibCompiler } from './uc-lib-compiler.js';
import { UnsupportedUcSchema } from './unsupported-uc-schema.js';

export class UcSchemaCompiler<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {

  readonly #lib: UcLibCompiler;
  readonly #schema: TSchema;
  readonly #serializerName: string;
  readonly #declarations: UcCodeDeclarations;

  constructor(options: UcSchemaCompiler.Options<T, TSchema>);
  constructor({ lib, schema, serializerName }: UcSchemaCompiler.Options<T, TSchema>) {
    this.#lib = lib;
    this.#schema = schema;
    this.#serializerName = serializerName;

    this.#declarations = new UcCodeDeclarations(this.aliases);
    this.#schema = schema;
  }

  get lib(): UcLibCompiler {
    return this.#lib;
  }

  get schema(): TSchema {
    return this.#schema;
  }

  get serializerName(): string {
    return this.#serializerName;
  }

  get aliases(): UcCodeAliases {
    return this.#lib.aliases;
  }

  get declarations(): UcCodeDeclarations {
    return this.#declarations;
  }

  declare(name: string, code: string): string {
    return this.declarations.declare(name, code);
  }

  serialize(schema: UcSchema, value: string, code: UcCodeBuilder): void {
    const definitions = this.lib.definitionsFor(schema);

    if (
      !definitions
      || definitions.write(this as UcSchemaCompiler, schema, value, code) === false
    ) {
      throw new UnsupportedUcSchema(
        schema,
        `Can not serialize type "${schema.type} from "${schema.from}"`,
      );
    }
  }

  compile(code: UcCodeBuilder): void {
    code
      .write(`async function ${this.serializerName}(value, writer) {`)
      .indent(code => {
        code.write(this.declarations);
        this.serialize(this.#schema, 'value', code);
      })
      .write('}');
  }

}

export namespace UcSchemaCompiler {
  export interface Options<out T, out TSchema extends UcSchema<T>> {
    readonly lib: UcLibCompiler;
    readonly schema: TSchema;
    readonly serializerName: string;
  }
}
