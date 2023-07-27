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
import { UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UccSchemaIndex } from '../processor/ucc-schema-index.js';
import { UcsExportSignature } from './ucs-export.signature.js';
import { UcsFunction } from './ucs-function.js';
import { UcsGenerator } from './ucs-generator.js';
import { UcsModels } from './ucs-models.js';

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
  readonly #schemaIndex: UccSchemaIndex;
  readonly #models: UcsSchemaConfigs<TModels>;

  readonly #createSerializer: Exclude<UcsLib.Options<TModels>['createSerializer'], undefined>;
  readonly #serializers = new Map<string, UcsFunction>();

  #textEncoder?: EsSymbol;
  readonly #binConstants = new Map<string, EsSymbol>();

  constructor(bundle: EsBundle, options: UcsLib.Options<TModels>);
  constructor({ ns }: EsBundle, options: UcsLib.Options<TModels>) {
    this.#options = options;

    const { schemaIndex, models, createSerializer } = options;

    this.#schemaIndex = schemaIndex;
    this.#models = Object.fromEntries(
      Object.entries(models).map(([externalName, entry]) => [
        externalName,
        {
          ...entry,
          model: ucSchema(entry.model),
        },
      ]),
    ) as UcsSchemaConfigs<TModels>;
    this.#createSerializer = createSerializer;

    for (const [externalName, { model }] of Object.entries<UcsSchemaConfig>(this.#models)) {
      const fn = this.serializerFor(model);

      ns.refer(fn.exportFn(externalName, UcsExportSignature));
    }

    return this;
  }

  serializerFor<T, TSchema extends UcSchema<T>>(schema: TSchema): UcsFunction<T, TSchema> {
    const schemaId = this.#schemaIndex.schemaId(schema);
    let serializer = this.#serializers.get(schemaId) as UcsFunction<T, TSchema> | undefined;

    if (!serializer) {
      serializer = this.#createSerializer({
        schema,
      });
      this.#serializers.set(schemaId, serializer);
    }

    return serializer;
  }

  generatorFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcsGenerator<T> | undefined {
    return this.#options.generatorFor?.(schema);
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
    readonly schemaIndex: UccSchemaIndex;
    readonly models: TModels;

    generatorFor?<T, TSchema extends UcSchema<T>>(
      this: void,
      schema: TSchema,
    ): UcsGenerator<T, TSchema> | undefined;

    createSerializer<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcsFunction.Options<T, TSchema>,
    ): UcsFunction<T, TSchema>;
  }
}

type UcsSchemaConfigs<TModels extends UcsModels> = {
  readonly [externalName in keyof TModels]: UcsSchemaConfig<
    UcsModels.ModelOf<TModels[externalName]>
  >;
};

type UcsSchemaConfig<TModel extends UcModel = UcModel> = UcsModels.Entry<UcSchema.Of<TModel>>;
