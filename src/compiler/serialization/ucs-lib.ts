import { lazyValue } from '@proc7ts/primitives';
import { UcDataType, UcInfer, UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UcSerializer } from '../../schema/uc-serializer.js';
import { UccCode, UccFragment, UccSource } from '../codegen/ucc-code.js';
import { UccLib } from '../codegen/ucc-lib.js';
import { UcSchemaVariant, ucSchemaVariant } from '../impl/uc-schema-variant.js';
import { UcsFunction } from './ucs-function.js';
import { UcsGenerator } from './ucs-generator.js';

/**
 * Serializer library that {@link UcsLib#compileFactory compiles data models} into serialization functions.
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
  readonly #serializers = new Map<string | UcDataType, Map<UcSchemaVariant, UcsFunction>>();

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
      const fn = this.serializerFor(schema);

      this.#declareSerializer(fn, externalName);
    }
  }

  serializerFor<T, TSchema extends UcSchema<T>>(schema: TSchema): UcsFunction<T, TSchema> {
    const { id = schema.type } = schema;
    const variant = ucSchemaVariant(schema);

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
      });
      variants.set(variant, serializer);
    }

    return serializer;
  }

  #declareSerializer(fn: UcsFunction<unknown, any>, externalName: string): void {
    this.declarations.declareFunction(
      externalName,
      ['stream', 'value'],
      ({ args: { stream, value } }) => code => {
          code.write(fn.toUcSerializer(stream, value));
        },
      {
        async: true,
        exported: true,
      },
    );
  }

  generatorFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcsGenerator<T> | undefined;
  generatorFor<T, TSchema extends UcSchema<T> = UcSchema<T>>({
    type,
  }: TSchema): UcsGenerator<T> | undefined {
    return this.#options.generatorFor?.(type);
  }

  compileFactory(): UcsLib.Factory<TModels> {
    const compiled = this.compile('iife');

    return {
      lib: this,
      toCode: compiled.toCode,
      toExports: () => this.#toExports(compiled),
    };
  }

  async #toExports(compiled: UcsLib.Compiled<TModels>): Promise<UcsLib.Exports<TModels>> {
    const text = await compiled.toText();

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = Function(text) as () => Promise<UcsLib.Exports<TModels>>;

    return await factory();
  }

  compile(format: UccLib.Format = 'mjs'): UcsLib.Compiled<TModels> {
    const toCode = lazyValue(() => this.#toCode(format));

    return {
      lib: this,
      toCode,
      async toText() {
        return await new UccCode().write(toCode()).toText();
      },
    };
  }

  #toCode(format: UccLib.Format): UccSource {
    if (format === 'iife') {
      return code => {
        code.write('return (async () => {').indent(this.#toBody(format)).write(`})();`);
      };
    }

    return this.#toBody(format);
  }

  #toBody(format: UccLib.Format): UccSource {
    return code => {
      const declarations = this.declarations.compile(format);

      code.write(this.imports.compile(format), '', declarations.body, '', declarations.exports);
    };
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

  export interface Factory<TModels extends Models> extends UccFragment {
    readonly lib: UcsLib<TModels>;
    toExports(): Promise<Exports<TModels>>;
  }

  export interface Compiled<TModels extends Models> extends UccFragment {
    readonly lib: UcsLib<TModels>;
    toText(): Promise<string>;
  }
}
