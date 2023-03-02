import { asArray } from '@proc7ts/primitives';
import { UcSchemaResolver } from '../../schema/uc-schema-resolver.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcSerializer } from '../../schema/uc-serializer.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { UcSchema$Variant, UcSchema$variantOf } from '../impl/uc-schema.variant.js';
import { UccCode } from '../ucc-code.js';
import { UccDeclarations } from '../ucc-declarations.js';
import { UccImports } from '../ucc-imports.js';
import { UccNamespace } from '../ucc-namespace.js';
import { DefaultUcsDefs } from './default.ucs-defs.js';
import { UcsDef } from './ucs-def.js';
import { UcsFunction } from './ucs-function.js';

export class UcsLib<TSchemae extends UcsLib.Schemae = UcsLib.Schemae> {

  readonly #schemae: {
    readonly [externalName in keyof TSchemae]: UcSchema.Of<TSchemae[externalName]>;
  };

  readonly #ns: UccNamespace;
  readonly #imports: UccImports;
  readonly #declarations: UccDeclarations;
  readonly #definitions: Map<string | UcSchema.Class, UcsDef>;
  readonly #createSerializer: Required<UcsLib.Options<TSchemae>>['createSerializer'];
  readonly #serializers = new Map<string | UcSchema.Class, Map<UcSchema$Variant, UcsFunction>>();

  constructor(options: UcsLib.Options<TSchemae>);
  constructor({
    schemae,
    resolver = new UcSchemaResolver(),
    ns = new UccNamespace(),
    imports = new UccImports(ns),
    declarations = new UccDeclarations(ns),
    definitions = DefaultUcsDefs,
    createSerializer = options => new UcsFunction(options),
  }: UcsLib.Options<TSchemae>) {
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
    this.#createSerializer = createSerializer;

    for (const [externalName, schema] of Object.entries(this.#schemae)) {
      this.serializerFor(schema, externalName);
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

  serializerFor<T, TSchema extends UcSchema<T>>(
    schema: TSchema,
    externalName?: string,
  ): UcsFunction<T, TSchema> {
    const { id = schema.type } = schema;
    const variant = UcSchema$variantOf(schema);

    let variants = this.#serializers.get(id);

    if (!variants) {
      variants = new Map();
      this.#serializers.set(id, variants);
    }

    let serializer = variants.get(variant) as UcsFunction<T, TSchema> | undefined;

    if (!serializer) {
      serializer = this.#createSerializer({
        lib: this as UcsLib,
        schema,
        name: this.ns.name(`${externalName ?? ucSchemaSymbol(id)}$serialize${variant}`),
      });
      variants.set(variant, serializer);
    }

    return serializer;
  }

  definitionFor<T>(schema: UcSchema<T>): UcsDef<T> | undefined {
    return this.#definitions.get(schema.type) as UcsDef<T> | undefined;
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
          this.declarations,
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
              .indent(this.serializerFor(schema).toUcSerializer('stream', 'value'))
              .write('},');
          }
        })
        .write('};');
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
    return code => code.write(
        this.#imports.asStatic(),
        '',
        this.declarations,
        '',
        this.#compileSerializers(),
        '',
        this.#exportSerializers(),
      );
  }

  #exportSerializers(): UccCode.Builder {
    return code => {
      for (const [externalName, schema] of Object.entries(this.#schemae)) {
        code
          .write(`export async function ${externalName}(stream, value) {`)
          .indent(this.serializerFor(schema).toUcSerializer('stream', 'value'))
          .write('}');
      }
    };
  }

  #printModule(): string {
    return new UccCode().write(this.#toModuleCode()).toString();
  }

  #compileSerializers(): UccCode.Builder {
    return code => code.write(...this.#allSerializers());
  }

  *#allSerializers(): Iterable<UcsFunction> {
    for (const variants of this.#serializers.values()) {
      yield* variants.values();
    }
  }

}

export namespace UcsLib {
  export interface Options<TSchemae extends Schemae> {
    readonly schemae: TSchemae;
    readonly resolver?: UcSchemaResolver | undefined;
    readonly ns?: UccNamespace | undefined;
    readonly imports?: UccImports | undefined;
    readonly declarations?: UccDeclarations | undefined;
    readonly definitions?: UcsDef | readonly UcsDef[] | undefined;

    createSerializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcsFunction.Options<T, TSchema>,
    ): UcsFunction<T, TSchema>;
  }

  export interface Schemae {
    readonly [writer: string]: UcSchema.Spec;
  }

  export type Exports<TSchemae extends Schemae> = {
    readonly [writer in keyof TSchemae]: UcSerializer<UcSchema.DataType<TSchemae[writer]>>;
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
