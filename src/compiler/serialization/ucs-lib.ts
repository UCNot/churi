import { lazyValue } from '@proc7ts/primitives';
import { UcDataType, UcInfer, UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UcSerializer } from '../../schema/uc-serializer.js';
import { UccBuilder, UccCode, UccFragment } from '../codegen/ucc-code.js';
import { UccLib } from '../codegen/ucc-lib.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { UcSchema$Variant, ucUcSchemaVariant } from '../impl/uc-schema.variant.js';
import { UcsFunction } from './ucs-function.js';
import { UcsGenerator } from './ucs-generator.js';

/**
 * Serializer library that {@link UcsLib#compile compiles data models} into serialization functions.
 *
 * An {@link UcsSetup serializer setup} expected to be used to configure and {@link UcsSetup#bootstrap bootstrap}
 * the library instance.
 *
 * @typeParam TModels - Compiled models record type.
 */
export class UcsLib<TModels extends UcsLib.Models = UcsLib.Models> extends UccLib {

  readonly #models: {
    readonly [externalName in keyof TModels]: UcSchema.Of<TModels[externalName]>;
  };

  readonly #options: UcsLib.Options<TModels>;
  readonly #createSerializer: Exclude<UcsLib.Options<TModels>['createSerializer'], undefined>;
  readonly #serializers = new Map<string | UcDataType, Map<UcSchema$Variant, UcsFunction>>();

  constructor(options: UcsLib.Options<TModels>) {
    super(options);

    this.#options = options;

    const { models, createSerializer = options => new UcsFunction(options) } = options;

    this.#models = Object.fromEntries(
      Object.entries(models).map(([externalName, model]) => [externalName, ucSchema(model)]),
    ) as {
      readonly [externalName in keyof TModels]: UcSchema.Of<TModels[externalName]>;
    };
    this.#createSerializer = createSerializer;

    for (const [externalName, schema] of Object.entries(this.#models)) {
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

  generatorFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcsGenerator<T> | undefined;
  generatorFor<T, TSchema extends UcSchema<T> = UcSchema<T>>({
    type,
  }: TSchema): UcsGenerator<T> | undefined {
    return this.#options.generatorFor?.(type);
  }

  compile(): UcsLib.Compiled<TModels> {
    return {
      lib: this,
      toCode: this.#toFactoryCode.bind(this),
      toSerializers: this.#toSerializers.bind(this),
    };
  }

  #toFactoryCode(): UccBuilder {
    return code => {
      const declarations = this.declarations.compile('factory');

      code
        .write('return (async () => {')
        .indent(
          this.imports.asDynamic(),
          '',
          declarations.body,
          '',
          this.#compileSerializers(),
          '',
          this.#returnSerializers(),
          declarations.exports,
        )
        .write('})();');
    };
  }

  #returnSerializers(): UccBuilder {
    return code => {
      code
        .write('return {')
        .indent(code => {
          for (const [externalName, schema] of Object.entries(this.#models)) {
            code
              .write(`async ${externalName}(stream, value) {`)
              .indent(this.serializerFor(schema).toUcSerializer('stream', 'value'))
              .write('},');
          }
        })
        .write('};');
    };
  }

  async #toSerializers(): Promise<UcsLib.Exports<TModels>> {
    const text = await new UccCode().write(this.#toFactoryCode()).toText();

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = Function(text) as () => Promise<UcsLib.Exports<TModels>>;

    return await factory();
  }

  compileModule(format: UccLib.Format = 'mjs'): UcsLib.Module<TModels> {
    const toCode = lazyValue(() => this.#toCode(format));

    return {
      lib: this,
      toCode,
      async toText() {
        return await new UccCode().write(toCode()).toText();
      },
    };
  }

  #toCode(format: UccLib.Format): UccBuilder {
    return code => {
      const declarations = this.declarations.compile(format);

      code.write(
        this.imports.asStatic(),
        '',
        declarations.body,
        '',
        this.#compileSerializers(),
        '',
        this.#exportSerializers(),
        declarations.exports,
      );
    };
  }

  #exportSerializers(): UccBuilder {
    return code => {
      for (const [externalName, schema] of Object.entries(this.#models)) {
        code
          .write(`export async function ${externalName}(stream, value) {`)
          .indent(this.serializerFor(schema).toUcSerializer('stream', 'value'))
          .write('}');
      }
    };
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
  export interface Options<TModels extends Models> extends UccLib.Options {
    readonly models: TModels;

    generatorFor?<T, TSchema extends UcSchema<T>>(
      this: void,
      type: TSchema['type'],
    ): UcsGenerator<T, TSchema> | undefined;

    createSerializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcsFunction.Options<T, TSchema>,
    ): UcsFunction<T, TSchema>;
  }

  export interface Models {
    readonly [writer: string]: UcModel;
  }

  export type Exports<TModels extends Models> = {
    readonly [writer in keyof TModels]: UcSerializer<UcInfer<TModels[writer]>>;
  };

  export interface Compiled<TModels extends Models> extends UccFragment {
    readonly lib: UcsLib<TModels>;
    toSerializers(): Promise<Exports<TModels>>;
  }

  export interface Module<TModels extends Models> extends UccFragment {
    readonly lib: UcsLib<TModels>;
    toText(): Promise<string>;
  }
}
