import { asArray } from '@proc7ts/primitives';
import { UcSchema } from '../schema/uc-schema.js';
import { DefaultUcSchemaDefinitions } from './default.uc-schema-definitions.js';
import { UcCodeAliases } from './uc-code-aliases.js';
import { UcCodeBuilder } from './uc-code-builder.js';
import { UcCodeImports } from './uc-code-imports.js';
import { UcSchemaCompiler } from './uc-schema-compiler.js';
import { UcSchemaDefinitions } from './uc-schema-definitions.js';
import { UcSerializer } from './uc-serializer.js';

export class UcLibCompiler<TSchemae extends UcLibCompiler.Schemae = UcLibCompiler.Schemae> {

  readonly #schemae: TSchemae;
  readonly #definitions: Map<string, UcSchemaDefinitions>;
  readonly #aliases: UcCodeAliases;
  readonly #imports: UcCodeImports;
  readonly #schemaCompilers: Map<UcSchema, UcSchemaCompiler>;

  constructor(options: UcLibCompiler.Options<TSchemae>);
  constructor({
    schemae,
    definitions = DefaultUcSchemaDefinitions,
  }: UcLibCompiler.Options<TSchemae>) {
    this.#schemae = schemae;
    this.#definitions = new Map(
      asArray(definitions).map(definitions => [definitions.from, definitions]),
    );
    this.#aliases = new UcCodeAliases('value', 'writer');
    this.#imports = new UcCodeImports(this.#aliases);
    this.#schemaCompilers = new Map(
      Object.entries(schemae).map(([serializerName, schema]) => {
        const { like = schema } = schema;

        return [
          like,
          new UcSchemaCompiler({
            lib: this as UcLibCompiler<any>,
            schema: like,
            serializerName: this.aliases.aliasFor(serializerName),
          }),
        ];
      }),
    );
  }

  get aliases(): UcCodeAliases {
    return this.#aliases;
  }

  get imports(): UcCodeImports {
    return this.#imports;
  }

  import(from: string, name: string): string {
    return this.imports.import(from, name);
  }

  compilerFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcSchemaCompiler<T, TSchema> {
    const { like = schema } = schema;
    const found = this.#schemaCompilers.get(like) as UcSchemaCompiler<T, TSchema> | undefined;

    if (found) {
      return found;
    }

    const serializerName = this.aliases.aliasFor('serialize');
    const schemaCompiler = new UcSchemaCompiler<T, TSchema>({
      lib: this as UcLibCompiler<any>,
      schema: like as TSchema,
      serializerName,
    });

    this.#schemaCompilers.set(like, schemaCompiler as UcSchemaCompiler);

    return schemaCompiler;
  }

  definitionsFor(schema: UcSchema): UcSchemaDefinitions | undefined {
    return this.#definitions.get(schema.from);
  }

  async compile(): Promise<UcLibCompiler.Serializers<TSchemae>> {
    const code = new UcCodeBuilder();

    code
      .write('return (async () => {')
      .indent(code => {
        this.#importDynamically(code);
        this.#compileSchemae(code);
        code.write();
        this.#returnSerializers(code);
      })
      .write('})();');

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = Function(code.toString()) as () => Promise<UcLibCompiler.Serializers<TSchemae>>;

    return await factory();
  }

  #importDynamically(code: UcCodeBuilder): void {
    for (const [from, name, alias] of this.imports) {
      code.write(`const { ${name}: ${alias} } = await import('${from}')`);
    }
  }

  #returnSerializers(code: UcCodeBuilder): void {
    code
      .write('return {')
      .indent(code => {
        for (const [serializerName, schema] of Object.entries(this.#schemae)) {
          const schemaCompiler = this.compilerFor(schema);
          const serializerAlias = schemaCompiler.serializerName;

          if (serializerAlias === serializerAlias) {
            code.write(`${serializerName},`);
          } else {
            code.write(`${serializerName}: ${serializerAlias},`);
          }
        }
      })
      .write('}');
  }

  compileModule(): string {
    const code = new UcCodeBuilder();

    this.#importStatically(code);
    this.#compileSchemae(code);
    code.write();
    this.#exportSerializers(code);

    return code.toString();
  }

  #importStatically(code: UcCodeBuilder): void {
    for (const [from, name, alias] of this.#imports) {
      code.write(`import { ${name} as ${alias} } from '${from}'`);
    }
  }

  #exportSerializers(code: UcCodeBuilder): void {
    for (const [serializerName, schema] of Object.entries(this.#schemae)) {
      const schemaCompiler = this.compilerFor(schema);
      const serializerAlias = schemaCompiler.serializerName;

      if (serializerAlias === serializerAlias) {
        code.write(`export { ${serializerName} };`);
      } else {
        code.write(`export { ${serializerAlias} as ${serializerName} };`);
      }
    }
  }

  #compileSchemae(code: UcCodeBuilder): void {
    for (const schemaCompiler of this.#schemaCompilers.values()) {
      code.write();
      schemaCompiler.compile(code);
    }
  }

}

export namespace UcLibCompiler {
  export interface Options<TSchemae extends Schemae> {
    readonly schemae: TSchemae;
    readonly definitions?: UcSchemaDefinitions | readonly UcSchemaDefinitions[] | undefined;
  }

  export interface Schemae {
    readonly [writer: string]: UcSchema;
  }

  export type Serializers<TSchemae extends Schemae> = {
    readonly [writer in keyof TSchemae]: UcSerializer<UcSchema.ImpliedType<TSchemae[writer]>>;
  };
}
