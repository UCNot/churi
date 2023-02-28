import { asArray, lazyValue } from '@proc7ts/primitives';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { UcSchemaResolver } from '../../schema/uc-schema-resolver.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcSchema$Variant, UcSchema$variantOf } from '../impl/uc-schema.variant.js';
import { UccCode } from '../ucc-code.js';
import { UccDeclarations } from '../ucc-declarations.js';
import { UccImports } from '../ucc-imports.js';
import { UccNamespace } from '../ucc-namespace.js';
import { DefaultUcdDefs } from './default.ucd-defs.js';
import { UcdDef } from './ucd-def.js';
import { UcdFunction } from './ucd-function.js';
import { UcdTypeDef } from './ucd-type-def.js';

export class UcdLib<TSchemae extends UcdLib.Schemae = UcdLib.Schemae> {

  readonly #schemae: {
    readonly [externalName in keyof TSchemae]: UcSchema.Of<TSchemae[externalName]>;
  };

  readonly #ns: UccNamespace;
  readonly #imports: UccImports;
  readonly #declarations: UccDeclarations;
  readonly #typeDefs: Map<string | UcSchema.Class, UcdTypeDef>;
  readonly #createDeserializer: Required<UcdLib.Options<TSchemae>>['createDeserializer'];
  readonly #deserializers = new Map<string | UcSchema.Class, Map<UcSchema$Variant, UcdFunction>>();
  readonly #streamVar = lazyValue(() => this.ns.name('stream'));
  readonly #inputVar = lazyValue(() => this.ns.name('input'));
  readonly #optionsVar = lazyValue(() => this.ns.name('options'));

  constructor(options: UcdLib.Options<TSchemae>);

  constructor({
    schemae,
    resolver = new UcSchemaResolver(),
    ns = new UccNamespace(),
    imports = new UccImports(ns),
    declarations = new UccDeclarations(ns),
    definitions = DefaultUcdDefs,
    createDeserializer = options => new UcdFunction(options),
  }: UcdLib.Options<TSchemae>) {
    this.#schemae = Object.fromEntries(
      Object.entries(schemae).map(([externalName, schemaSpec]) => [
        externalName,
        resolver.schemaOf(schemaSpec),
      ]),
    ) as {
      readonly [externalName in keyof TSchemae]: UcSchema.Of<TSchemae[externalName]>;
    };
    this.#ns = ns;
    this.#imports = imports;
    this.#declarations = declarations;
    this.#typeDefs = new Map(asArray(definitions).map(def => [def.type, def]));
    this.#createDeserializer = createDeserializer;

    for (const [externalName, schema] of Object.entries(this.#schemae)) {
      this.#typeDefFor(schema, `${externalName}$deserialize`);
    }
  }

  get ns(): UccNamespace {
    return this.#ns;
  }

  get imports(): UccImports {
    return this.#imports;
  }

  get declarations(): UccDeclarations {
    return this.#declarations;
  }

  import(from: string, name: string): string {
    return this.imports.import(from, name);
  }

  deserializerFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcdFunction<T, TSchema> {
    return this.#typeDefFor(schema, '$deserialize');
  }

  #typeDefFor<T, TSchema extends UcSchema<T>>(
    schema: TSchema,
    name: string,
  ): UcdFunction<T, TSchema> {
    const { type } = schema;
    const variant = UcSchema$variantOf(schema);

    let variants = this.#deserializers.get(type);

    if (!variants) {
      variants = new Map();
      this.#deserializers.set(type, variants);
    }

    let deserializer = variants.get(variant) as UcdFunction<T, TSchema> | undefined;

    if (!deserializer) {
      deserializer = this.#createDeserializer({
        lib: this as UcdLib,
        schema,
        name: this.ns.name(`${name}${variant}`),
      });
      variants.set(variant, deserializer);
    }

    return deserializer;
  }

  definitionFor<T>(schema: UcSchema<T>): UcdTypeDef<T> | undefined {
    return this.#typeDefs.get(schema.type) as UcdTypeDef<T> | undefined;
  }

  compile(mode: 'async'): UcdLib.AsyncCompiled<TSchemae>;
  compile(mode: 'sync'): UcdLib.SyncCompiled<TSchemae>;
  compile(mode?: UcDeserializer.Mode): UcdLib.Compiled<TSchemae>;

  compile(mode: UcDeserializer.Mode = 'all'): UcdLib.Compiled<TSchemae> {
    return {
      lib: this,
      toCode: () => this.#toFactoryCode(mode),
      toDeserializers: () => this.#toDeserializers(mode),
    };
  }

  #toFactoryCode(mode: UcDeserializer.Mode): UccCode.Builder {
    return code => code
        .write('return (async () => {')
        .indent(
          this.imports.asDynamic(),
          '',
          this.declarations,
          '',
          this.#compileDeserializers(mode),
          '',
          this.#returnDeserializers(mode),
        )
        .write('})();');
  }

  #returnDeserializers(mode: UcDeserializer.Mode): UccCode.Builder {
    const input = mode === 'async' ? this.#streamVar() : this.#inputVar();
    const options = this.#optionsVar();

    return code => code
        .write('return {')
        .indent(code => {
          for (const [externalName, schema] of Object.entries(this.#schemae)) {
            code
              .write(`${mode === 'async' ? 'async ' : ''}${externalName}(${input}, ${options}) {`)
              .indent(this.deserializerFor(schema).toUcDeserializer(mode, input, options))
              .write('},');
          }
        })
        .write('};');
  }

  async #toDeserializers(mode: UcDeserializer.Mode): Promise<UcdLib.Exports<TSchemae>> {
    const code = new UccCode().write(this.#toFactoryCode(mode)).toString();

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = Function(code) as () => Promise<UcdLib.Exports<TSchemae>>;

    return await factory();
  }

  compileModule(mode: UcDeserializer.Mode = 'all'): UcdLib.Module<TSchemae> {
    return {
      lib: this,
      toCode: () => this.#toModuleCode(mode),
      print: () => this.#printModule(mode),
    };
  }

  #toModuleCode(mode: UcDeserializer.Mode): UccCode.Builder {
    return code => code.write(
        this.#imports.asStatic(),
        '',
        this.declarations,
        '',
        this.#compileDeserializers(mode),
        '',
        this.#exportDeserializers(mode),
      );
  }

  #exportDeserializers(mode: UcDeserializer.Mode): UccCode.Builder {
    if (mode === 'async') {
      return this.#exportAsyncDeserializers();
    }

    const input = this.#inputVar();
    const options = this.#optionsVar();

    return code => {
      for (const [externalName, schema] of Object.entries(this.#schemae)) {
        code
          .write(`export function ${externalName}(${input}, ${options}) {`)
          .indent(this.deserializerFor(schema).toUcDeserializer(mode, input, options))
          .write('}');
      }
    };
  }

  #exportAsyncDeserializers(): UccCode.Builder {
    const stream = this.#streamVar();
    const options = this.#optionsVar();

    return code => {
      for (const [externalName, schema] of Object.entries(this.#schemae)) {
        code
          .write(`export async function ${externalName}(${stream}, ${options}) {`)
          .indent(this.deserializerFor(schema).toUcDeserializer('async', stream, options))
          .write('}');
      }
    };
  }

  #printModule(mode: UcDeserializer.Mode): string {
    return new UccCode().write(this.#toModuleCode(mode)).toString();
  }

  #compileDeserializers(mode: UcDeserializer.Mode): UccCode.Builder {
    return code => {
      for (const fn of this.#allDeserializers()) {
        if (mode !== 'sync') {
          code.write(fn.asAsync());
        }
        if (mode !== 'async') {
          code.write(fn.asSync());
        }
      }
    };
  }

  *#allDeserializers(): Iterable<UcdFunction> {
    for (const variants of this.#deserializers.values()) {
      yield* variants.values();
    }
  }

}

export namespace UcdLib {
  export interface Options<TSchemae extends Schemae> {
    readonly schemae: TSchemae;
    readonly resolver?: UcSchemaResolver | undefined;
    readonly ns?: UccNamespace | undefined;
    readonly imports?: UccImports | undefined;
    readonly declarations?: UccDeclarations | undefined;
    readonly definitions?: UcdDef | readonly UcdDef[] | undefined;

    createDeserializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcdFunction.Options<T, TSchema>,
    ): UcdFunction<T, TSchema>;
  }

  export interface Schemae {
    readonly [reader: string]: UcSchema.Spec;
  }

  export type Exports<TSchemae extends Schemae> = {
    readonly [reader in keyof TSchemae]: UcDeserializer<UcSchema.DataType<TSchemae[reader]>>;
  };

  export type AsyncExports<TSchemae extends Schemae> = {
    readonly [reader in keyof TSchemae]: UcDeserializer.Async<UcSchema.DataType<TSchemae[reader]>>;
  };

  export type SyncExports<TSchemae extends Schemae> = {
    readonly [reader in keyof TSchemae]: UcDeserializer.Sync<UcSchema.DataType<TSchemae[reader]>>;
  };

  export interface Compiled<TSchemae extends Schemae> extends UccCode.Fragment {
    readonly lib: UcdLib<TSchemae>;
    toDeserializers(): Promise<Exports<TSchemae>>;
  }

  export interface AsyncCompiled<TSchemae extends Schemae> extends UccCode.Fragment {
    readonly lib: UcdLib<TSchemae>;
    toDeserializers(): Promise<AsyncExports<TSchemae>>;
  }

  export interface SyncCompiled<TSchemae extends Schemae> extends UccCode.Fragment {
    readonly lib: UcdLib<TSchemae>;
    toDeserializers(): Promise<SyncExports<TSchemae>>;
  }

  export interface Module<TSchemae extends Schemae> extends UccCode.Fragment {
    readonly lib: UcdLib<TSchemae>;
    print(): string;
  }
}
