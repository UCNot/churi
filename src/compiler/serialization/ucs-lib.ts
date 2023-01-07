import { asArray } from '@proc7ts/primitives';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccAliases } from '../ucc-aliases.js';
import { UccCode } from '../ucc-code.js';
import { UccDeclarations } from '../ucc-declarations.js';
import { UccImports } from '../ucc-imports.js';
import { DefaultUcsDefs } from './default.ucs-defs.js';
import { UcSerializer } from './uc-serializer.js';
import { UcsDefs } from './ucs-defs.js';
import { UcsFunction } from './ucs-function.js';

export class UcsLib<TSchemae extends UcsLib.Schemae = UcsLib.Schemae> {

  readonly #schemae: TSchemae;
  readonly #definitions: Map<string, UcsDefs>;
  readonly #aliases: UccAliases;
  readonly #imports: UccImports;
  readonly #declarations: UccDeclarations;
  readonly #createSerializer: Required<UcsLib.Options<TSchemae>>['createSerializer'];
  readonly #serializerArgs: UcsFunction.Args;
  readonly #serializers: Map<UcSchema, UcsFunction>;

  constructor(options: UcsLib.Options<TSchemae>);
  constructor({
    schemae,
    aliases = new UccAliases(),
    imports = new UccImports(aliases),
    declarations = new UccDeclarations(aliases),
    definitions = DefaultUcsDefs,
    createSerializer = options => new UcsFunction(options),
  }: UcsLib.Options<TSchemae>) {
    this.#schemae = schemae;
    this.#definitions = new Map(
      asArray(definitions).map(definitions => [definitions.from, definitions]),
    );
    this.#aliases = aliases;
    this.#imports = imports;
    this.#declarations = declarations;
    this.#createSerializer = createSerializer;

    this.#serializerArgs = {
      writer: aliases.aliasFor('writer'),
      value: aliases.aliasFor('value'),
    };

    this.#serializers = new Map(
      Object.entries(schemae).map(([externalName, schema]) => {
        const { like = schema } = schema;

        return [
          like,
          createSerializer({
            lib: this as UcsLib<any>,
            schema: like,
            name: this.aliases.aliasFor(`${externalName}$serialize`),
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

  get declarations(): UccDeclarations {
    return this.#declarations;
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

    const serializer = this.#createSerializer<T, TSchema>({
      lib: this as UcsLib,
      schema: like as TSchema,
      name: this.aliases.aliasFor('$serialize'),
    });

    this.#serializers.set(like, serializer as UcsFunction);

    return serializer;
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

  #toFactoryCode(): UccCode.Builder {
    return code => code
        .write('return (async () => {')
        .indent(
          this.imports.asDynamic(),
          '',
          this.#compileSerializers(),
          '',
          this.#returnSerializers(),
        )
        .write('})();');
  }

  #returnSerializers(): UccCode.Builder {
    return code => code
        .write('return {')
        .indent(code => {
          for (const [externalName, schema] of Object.entries(this.#schemae)) {
            code
              .write(`async ${externalName}(stream, value) {`)
              .indent(this.serializerFor(schema).toUcsSerializer('value'))
              .write('}');
          }
        })
        .write('}');
  }

  async #toSerializers(): Promise<UcsLib.Exports<TSchemae>> {
    const code = new UccCode().write(this.#toFactoryCode()).toString();

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = Function(code) as () => Promise<UcsLib.Exports<TSchemae>>;

    return await factory();
  }

  compileModule(): UcsLib.Module<TSchemae> {
    return {
      lib: this,
      toCode: this.#toModuleCode.bind(this),
      print: this.#printModule.bind(this),
    };
  }

  #toModuleCode(): UccCode.Builder {
    return code => code.write(this.#imports.asStatic(), this.#compileSerializers(), this.#exportSerializers());
  }

  #exportSerializers(): UccCode.Builder {
    return code => {
      for (const [externalName, schema] of Object.entries(this.#schemae)) {
        code
          .write(`export async function ${externalName}(stream, value) {`)
          .indent(this.serializerFor(schema).toUcsSerializer('value'))
          .write('}');
      }
    };
  }

  #printModule(): string {
    return new UccCode().write(this.#toModuleCode()).toString();
  }

  #compileSerializers(): UccCode.Builder {
    return code => code.write(...this.#serializers.values());
  }

}

export namespace UcsLib {
  export interface Options<TSchemae extends Schemae> {
    readonly schemae: TSchemae;
    readonly aliases?: UccAliases | undefined;
    readonly imports?: UccImports | undefined;
    readonly declarations?: UccDeclarations | undefined;
    readonly definitions?: UcsDefs | readonly UcsDefs[] | undefined;

    createSerializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcsFunction.Options<T, TSchema>,
    ): UcsFunction<T, TSchema>;
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
    print(): string;
  }
}
