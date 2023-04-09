import { asArray } from '@proc7ts/primitives';
import { UcSchemaResolver } from '../../schema/uc-schema-resolver.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcSerializer } from '../../schema/uc-serializer.js';
import { UccBuilder, UccCode, UccFragment } from '../codegen/ucc-code.js';
import { UccLib } from '../codegen/ucc-lib.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { UcSchema$Variant, ucUcSchemaVariant } from '../impl/uc-schema.variant.js';
import { DefaultUcsDefs } from './default.ucs-defs.js';
import { UcsDef } from './ucs-def.js';
import { UcsFunction } from './ucs-function.js';

export class UcsLib<TSchemae extends UcsLib.Schemae = UcsLib.Schemae> extends UccLib {

  readonly #schemae: {
    readonly [externalName in keyof TSchemae]: UcSchema.Of<TSchemae[externalName]>;
  };

  readonly #definitions: Map<string | UcSchema.Class, UcsDef>;
  readonly #createSerializer: Exclude<UcsLib.Options<TSchemae>['createSerializer'], undefined>;
  readonly #serializers = new Map<string | UcSchema.Class, Map<UcSchema$Variant, UcsFunction>>();

  constructor(options: UcsLib.Options<TSchemae>) {
    super(options);

    const {
      schemae,
      resolver = new UcSchemaResolver(),
      definitions = DefaultUcsDefs,
      createSerializer = options => new UcsFunction(options),
    } = options;

    this.#schemae = Object.fromEntries(
      Object.entries(schemae).map(([externalName, schemaSpec]) => [
        externalName,
        resolver.schemaOf(schemaSpec),
      ]),
    ) as {
      readonly [externalName in keyof TSchemae]: UcSchema.Of<TSchemae[externalName]>;
    };
    this.#definitions = new Map(asArray(definitions).map(def => [def.type, def]));
    this.#createSerializer = createSerializer;

    for (const [externalName, schema] of Object.entries(this.#schemae)) {
      this.serializerFor(schema, externalName);
    }
  }

  serializerFor<T, TSchema extends UcSchema<T>>(
    schema: TSchema,
    externalName?: string,
  ): UcsFunction<T, TSchema> {
    const { id = schema.type } = schema;
    const variant = ucUcSchemaVariant(schema);

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
        name: this.ns.name(`${externalName ?? ucSchemaSymbol(schema)}$serialize${variant}`),
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

  #toFactoryCode(): UccBuilder {
    return code => {
      code
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
    };
  }

  #returnSerializers(): UccBuilder {
    return code => {
      code
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
    };
  }

  async #toSerializers(): Promise<UcsLib.Exports<TSchemae>> {
    const text = await new UccCode().write(this.#toFactoryCode()).toText();

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = Function(text) as () => Promise<UcsLib.Exports<TSchemae>>;

    return await factory();
  }

  compileModule(): UcsLib.Module<TSchemae> {
    return {
      lib: this,
      toCode: this.#toModuleCode.bind(this),
      toText: this.#toModuleText.bind(this),
    };
  }

  #toModuleCode(): UccBuilder {
    return code => {
      code.write(
        this.imports.asStatic(),
        '',
        this.declarations,
        '',
        this.#compileSerializers(),
        '',
        this.#exportSerializers(),
      );
    };
  }

  #exportSerializers(): UccBuilder {
    return code => {
      for (const [externalName, schema] of Object.entries(this.#schemae)) {
        code
          .write(`export async function ${externalName}(stream, value) {`)
          .indent(this.serializerFor(schema).toUcSerializer('stream', 'value'))
          .write('}');
      }
    };
  }

  async #toModuleText(): Promise<string> {
    return await new UccCode().write(this.#toModuleCode()).toText();
  }

  #compileSerializers(): UccBuilder {
    return code => {
      code.write(...this.#allSerializers());
    };
  }

  *#allSerializers(): Iterable<UcsFunction> {
    for (const variants of this.#serializers.values()) {
      yield* variants.values();
    }
  }

}

export namespace UcsLib {
  export interface Options<TSchemae extends Schemae> extends UccLib.Options {
    readonly schemae: TSchemae;
    readonly resolver?: UcSchemaResolver | undefined;
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

  export interface Compiled<TSchemae extends Schemae> extends UccFragment {
    readonly lib: UcsLib<TSchemae>;
    toSerializers(): Promise<Exports<TSchemae>>;
  }

  export interface Module<TSchemae extends Schemae> extends UccFragment {
    readonly lib: UcsLib<TSchemae>;
    toText(): Promise<string>;
  }
}
