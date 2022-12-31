import { asArray } from '@proc7ts/primitives';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccAliases } from '../ucc-aliases.js';
import { UccCode } from '../ucc-code.js';
import { UccImports } from '../ucc-imports.js';
import { DefaultUcsDefs } from './default.ucs-defs.js';
import { UcSerializer } from './uc-serializer.js';
import { UcsDefs } from './ucs-defs.js';
import { UcsFunction } from './ucs-function.js';

export class UcsLib<TSchemae extends UcsLib.Schemae = UcsLib.Schemae> {

  readonly #schemae: TSchemae;
  readonly #definitions: Map<string, UcsDefs>;
  readonly #aliases: UccAliases;
  readonly #serializerArgs: UcsFunction.Args;
  readonly #imports: UccImports;
  readonly #serializers: Map<UcSchema, UcsFunction>;

  constructor(options: UcsLib.Options<TSchemae>);
  constructor({
    schemae,
    aliases = new UccAliases(),
    imports = new UccImports(aliases),
    definitions = DefaultUcsDefs,
  }: UcsLib.Options<TSchemae>) {
    this.#schemae = schemae;
    this.#definitions = new Map(
      asArray(definitions).map(definitions => [definitions.from, definitions]),
    );
    this.#aliases = aliases;
    this.#serializerArgs = {
      writer: aliases.aliasFor('writer'),
      value: aliases.aliasFor('value'),
    };

    this.#imports = imports;
    this.#serializers = new Map(
      Object.entries(schemae).map(([serializerName, schema]) => {
        const { like = schema } = schema;

        return [
          like,
          new UcsFunction({
            lib: this as UcsLib<any>,
            schema: like,
            name: this.aliases.aliasFor(serializerName),
          }),
        ];
      }),
    );
  }

  get aliases(): UccAliases {
    return this.#aliases;
  }

  get imports(): UccImports {
    return this.#imports;
  }

  get serializerArgs(): UcsFunction.Args {
    return this.#serializerArgs;
  }

  import(from: string, name: string): string {
    return this.imports.import(from, name);
  }

  serializerFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcsFunction<T, TSchema> {
    const { like = schema } = schema;
    const found = this.#serializers.get(like);

    if (found) {
      return found as UcsFunction<T, TSchema>;
    }

    const serializerName = this.aliases.aliasFor('serialize');
    const schemaCompiler = new UcsFunction<T, TSchema>({
      lib: this as UcsLib<any>,
      schema: like as TSchema,
      name: serializerName,
    });

    this.#serializers.set(like, schemaCompiler as UcsFunction);

    return schemaCompiler;
  }

  definitionsFor(schema: UcSchema): UcsDefs | undefined {
    return this.#definitions.get(schema.from);
  }

  compile(): UcsLib.Compiled<TSchemae> {
    return {
      lib: this,
      toCode: this.#toFactoryCode.bind(this),
      toSerializers: this.#toSerializers.bind(this),
    };
  }

  #toFactoryCode(code: UccCode): void {
    code
      .write('return (async () => {')
      .indent(code => {
        code.write(this.imports.asDynamic());
        code.write(() => this.#compileSerializers(code));
        code.write();
        this.#returnSerializers(code);
      })
      .write('})();');
  }

  #returnSerializers(code: UccCode): void {
    code
      .write('return {')
      .indent(code => {
        for (const [serializerName, schema] of Object.entries(this.#schemae)) {
          const schemaCompiler = this.serializerFor(schema);
          const serializerAlias = schemaCompiler.name;

          if (serializerAlias === serializerAlias) {
            code.write(`${serializerName},`);
          } else {
            code.write(`${serializerName}: ${serializerAlias},`);
          }
        }
      })
      .write('}');
  }

  async #toSerializers(): Promise<UcsLib.Exports<TSchemae>> {
    const code = new UccCode();

    this.#toFactoryCode(code);

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = Function(await code.print()) as () => Promise<UcsLib.Exports<TSchemae>>;

    return await factory();
  }

  compileModule(): UcsLib.Module<TSchemae> {
    return {
      lib: this,
      toCode: this.#toModuleCode.bind(this),
      print: this.#printModule.bind(this),
    };
  }

  async #toModuleCode(code: UccCode): Promise<void> {
    code.write(this.#imports.asStatic());
    await this.#compileSerializers(code);
    code.write();
    this.#exportSerializers(code);
  }

  #exportSerializers(code: UccCode): void {
    for (const [serializerName, schema] of Object.entries(this.#schemae)) {
      const schemaCompiler = this.serializerFor(schema);
      const serializerAlias = schemaCompiler.name;

      if (serializerAlias === serializerAlias) {
        code.write(`export { ${serializerName} };`);
      } else {
        code.write(`export { ${serializerAlias} as ${serializerName} };`);
      }
    }
  }

  async #printModule(): Promise<string> {
    const code = new UccCode();

    await this.#toModuleCode(code);

    return await code.print();
  }

  async #compileSerializers(code: UccCode): Promise<void> {
    for (const serializer of this.#serializers.values()) {
      code.write();
      await serializer.toCode(code);
    }
  }

}

export namespace UcsLib {
  export interface Options<TSchemae extends Schemae> {
    readonly schemae: TSchemae;
    readonly aliases?: UccAliases | undefined;
    readonly imports?: UccImports | undefined;
    readonly definitions?: UcsDefs | readonly UcsDefs[] | undefined;
  }

  export interface Schemae {
    readonly [writer: string]: UcSchema;
  }

  export type Exports<TSchemae extends Schemae> = {
    readonly [writer in keyof TSchemae]: UcSerializer<UcSchema.ImpliedType<TSchemae[writer]>>;
  };

  export interface Compiled<TSchemae extends Schemae> extends UccCode.Fragment {
    readonly lib: UcsLib<TSchemae>;
    toSerializers(): Promise<Exports<TSchemae>>;
  }

  export interface Module<TSchemae extends Schemae> extends UccCode.Fragment {
    readonly lib: UcsLib<TSchemae>;
    print(): Promise<string>;
  }
}
