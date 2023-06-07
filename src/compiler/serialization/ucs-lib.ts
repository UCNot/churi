import {
  EsBundle,
  EsScope,
  EsSymbol,
  EsVarKind,
  EsVarSymbol,
  esConst,
  esStringLiteral,
  esline,
} from 'esgen';
import { UcDataType, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UcSchemaVariant, ucSchemaVariant } from '../impl/uc-schema-variant.js';
import { UcsModels } from './ucs-compiler.js';
import { UcsExportSignature } from './ucs-export.signature.js';
import { UcsFunction } from './ucs-function.js';
import { UcsGenerator } from './ucs-generator.js';

/**
 * Serializer library allocated by {@link UcsCompiler#bootstrap compiler}.
 *
 * @typeParam TModels - Compiled models record type.
 */
export class UcsLib<out TModels extends UcsModels = UcsModels> {

  static esScopedValue(scope: EsScope): UcsLib {
    const { bundle } = scope;

    if (bundle !== scope) {
      return bundle.get(UcsLib);
    }

    throw new ReferenceError('UcsLib is not initialized');
  }

  readonly #options: UcsLib.Options<TModels>;
  readonly #models: {
    readonly [externalName in keyof TModels]: UcSchema.Of<TModels[externalName]>;
  };

  readonly #createSerializer: Exclude<UcsLib.Options<TModels>['createSerializer'], undefined>;
  readonly #serializers = new Map<string | UcDataType, Map<UcSchemaVariant, UcsFunction>>();

  #textEncoder?: EsSymbol;
  readonly #binConstants = new Map<string, EsSymbol>();

  constructor(bundle: EsBundle, options: UcsLib.Options<TModels>);
  constructor({ ns }: EsBundle, options: UcsLib.Options<TModels>) {
    this.#options = options;

    const { models, createSerializer } = options;

    this.#models = Object.fromEntries(
      Object.entries(models).map(([externalName, model]) => [externalName, ucSchema(model)]),
    ) as {
      readonly [externalName in keyof TModels]: UcSchema.Of<TModels[externalName]>;
    };
    this.#createSerializer = createSerializer;

    for (const [externalName, schema] of Object.entries(this.#models)) {
      const fn = this.serializerFor(schema);

      ns.refer(fn.exportFn(externalName, UcsExportSignature));
    }

    return this;
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
        schema,
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

  binConst(value: string): EsSymbol {
    const encoder = (this.#textEncoder ??= esConst('TEXT_ENCODER', 'new TextEncoder()'));

    const existing = this.#binConstants.get(value);

    if (existing) {
      return existing;
    }

    const newConst = new EsVarSymbol(`EP_${value}`, {
      declare: {
        at: 'bundle',
        as: EsVarKind.Const,
        value: () => esline`${encoder}.encode(${esStringLiteral(value)})`,
        refers: encoder,
      },
    });

    this.#binConstants.set(value, newConst);

    return newConst;
  }

}

export namespace UcsLib {
  export interface Options<out TModels extends UcsModels> {
    readonly models: TModels;

    generatorFor?<T, TSchema extends UcSchema<T>>(
      this: void,
      type: TSchema['type'],
    ): UcsGenerator<T, TSchema> | undefined;

    createSerializer<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcsFunction.Options<T, TSchema>,
    ): UcsFunction<T, TSchema>;
  }
}
