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
import { UcFormatName } from '../../schema/uc-presentations.js';
import { UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UccSchemaIndex } from '../bootstrap/ucc-schema-index.js';
import { UcsFormatter } from './ucs-formatter.js';
import { UcsFunction } from './ucs-function.js';
import { UcsInsetFormatter, UcsInsetRequest } from './ucs-inset-formatter.js';
import { UcsModels } from './ucs-models.js';
import { CreateUcsWriterExpr } from './ucs-writer.class.js';

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

    for (const [externalName, entry] of Object.entries<UcsSchemaConfig>(this.#models)) {
      const fn = this.serializerFor(entry.model);

      ns.refer(fn.exportFn(this.#options.requestExport(externalName), entry));
    }

    return this;
  }

  serializerFor<T, TSchema extends UcSchema<T>>(schema: TSchema): UcsFunction<T, TSchema> {
    const schemaId = this.#schemaIndex.schemaId(schema);
    let serializer = this.#serializers.get(schemaId) as UcsFunction<T, TSchema> | undefined;

    if (!serializer) {
      serializer = this.#createSerializer({
        schema,
        createWriter: this.#options.createWriter,
      });
      this.#serializers.set(schemaId, serializer);
    }

    return serializer;
  }

  findFormatter<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    format: UcFormatName,
    schema: TSchema,
  ): UcsFormatter<T, TSchema> | undefined {
    return this.#options.findFormatter?.(format, schema);
  }

  findInsetFormatter<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    request: UcsInsetRequest<T, TSchema>,
  ): UcsInsetFormatter<T, TSchema> | undefined {
    return this.#options.findInsetFormatter?.(this, request);
  }

  binConst(value: string): EsSymbol {
    let binConst = this.#binConstants.get(value);

    if (!binConst) {
      binConst = this.#createBinConst(value);
      this.#binConstants.set(value, binConst);
    }

    return binConst;
  }

  #createBinConst(value: string): EsSymbol {
    const encoder = (this.#textEncoder ??= esConst('TEXT_ENCODER', 'new TextEncoder()'));

    return new EsVarSymbol(`EP_${value}`, {
      declare: {
        at: 'bundle',
        as: EsVarKind.Const,
        value: () => esline`${encoder}.encode(${esStringLiteral(value)})`,
        refers: encoder,
      },
    });
  }

}

export namespace UcsLib {
  export interface Options<out TModels extends UcsModels> {
    readonly schemaIndex: UccSchemaIndex;
    readonly models: TModels;

    readonly findFormatter?:
      | (<T, TSchema extends UcSchema<T>>(
          this: void,
          format: UcFormatName,
          schema: TSchema,
        ) => UcsFormatter<T, TSchema> | undefined)
      | undefined;

    readonly findInsetFormatter?:
      | (<T, TSchema extends UcSchema<T>>(
          this: void,
          lib: UcsLib,
          request: UcsInsetRequest<T, TSchema>,
        ) => UcsInsetFormatter<T, TSchema> | undefined)
      | undefined;

    readonly createWriter?:
      | ((this: void, format: UcFormatName) => CreateUcsWriterExpr | undefined)
      | undefined;

    createSerializer<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcsFunction.Options<T, TSchema>,
    ): UcsFunction<T, TSchema>;

    requestExport(entry: string): UcsFunction.ExportRequest;
  }
}

type UcsSchemaConfigs<TModels extends UcsModels> = {
  readonly [externalName in keyof TModels]: UcsSchemaConfig<
    UcsModels.ModelOf<TModels[externalName]>
  >;
};

type UcsSchemaConfig<TModel extends UcModel = UcModel> = UcsModels.Entry<UcSchema.Of<TModel>>;
