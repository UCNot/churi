import { asArray } from '@proc7ts/primitives';
import { UcDeserializer } from '../../deserializer/uc-deserializer.js';
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

export class UcdLib<TSchemae extends UcdLib.Schemae = UcdLib.Schemae> {

  readonly #schemae: {
    readonly [externalName in keyof TSchemae]: UcSchema.Of<TSchemae[externalName]>;
  };

  readonly #ns: UccNamespace;
  readonly #imports: UccImports;
  readonly #declarations: UccDeclarations;
  readonly #definitions: Map<string | UcSchema.Class, UcdDef>;
  readonly #createDeserializer: Required<UcdLib.Options<TSchemae>>['createDeserializer'];
  readonly #deserializers = new Map<string | UcSchema.Class, Map<UcSchema$Variant, UcdFunction>>();

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
    this.#definitions = new Map(asArray(definitions).map(def => [def.type, def]));
    this.#createDeserializer = createDeserializer;

    for (const [externalName, schema] of Object.entries(this.#schemae)) {
      this.#deserializerFor(schema, `${externalName}$deserialize`);
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
    return this.#deserializerFor(schema, '$deserialize');
  }

  #deserializerFor<T, TSchema extends UcSchema<T>>(
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

  definitionFor<T>(schema: UcSchema<T>): UcdDef<T> | undefined {
    return this.#definitions.get(schema.type) as UcdDef<T> | undefined;
  }

  compile(): UcdLib.Compiled<TSchemae> {
    return {
      lib: this,
      toCode: this.#toFactoryCode.bind(this),
      toDeserializers: this.#toDeserializers.bind(this),
    };
  }

  #toFactoryCode(): UccCode.Builder {
    return code => code
        .write('return (async () => {')
        .indent(
          this.imports.asDynamic(),
          '',
          this.declarations,
          '',
          this.#compileDeserializers(),
          '',
          this.#returnDeserializers(),
        )
        .write('})();');
  }

  #returnDeserializers(): UccCode.Builder {
    return code => code
        .write('return {')
        .indent(code => {
          for (const [externalName, schema] of Object.entries(this.#schemae)) {
            code
              .write(`async ${externalName}(stream, options) {`)
              .indent(this.deserializerFor(schema).toUcDeserializer('stream', 'options'))
              .write('},');
          }
        })
        .write('};');
  }

  async #toDeserializers(): Promise<UcdLib.Exports<TSchemae>> {
    const code = new UccCode().write(this.#toFactoryCode()).toString();

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = Function(code) as () => Promise<UcdLib.Exports<TSchemae>>;

    return await factory();
  }

  compileModule(): UcdLib.Module<TSchemae> {
    return {
      lib: this,
      toCode: this.#toModuleCode.bind(this),
      print: this.#printModule.bind(this),
    };
  }

  #toModuleCode(): UccCode.Builder {
    return code => code.write(
        this.#imports.asStatic(),
        '',
        this.declarations,
        '',
        this.#compileDeserializers(),
        '',
        this.#exportDeserializers(),
      );
  }

  #exportDeserializers(): UccCode.Builder {
    return code => {
      for (const [externalName, schema] of Object.entries(this.#schemae)) {
        code
          .write(`export async function ${externalName}(stream, options) {`)
          .indent(this.deserializerFor(schema).toUcDeserializer('stream', 'options'))
          .write('}');
      }
    };
  }

  #printModule(): string {
    return new UccCode().write(this.#toModuleCode()).toString();
  }

  #compileDeserializers(): UccCode.Builder {
    return code => code.write(...this.#allDeserializers());
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

  export interface Compiled<TSchemae extends Schemae> extends UccCode.Fragment {
    readonly lib: UcdLib<TSchemae>;
    toDeserializers(): Promise<Exports<TSchemae>>;
  }

  export interface Module<TSchemae extends Schemae> extends UccCode.Fragment {
    readonly lib: UcdLib<TSchemae>;
    print(): string;
  }
}
