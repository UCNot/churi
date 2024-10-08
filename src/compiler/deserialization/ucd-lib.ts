import { EsBundle, EsCallable, EsNamespace, EsSnippet, esline } from 'esgen';
import { UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UccSchemaIndex } from '../bootstrap/ucc-schema-index.js';
import { UC_MODULE_DESERIALIZER_META } from '../impl/uc-modules.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';
import { UcdFunction } from './ucd-function.js';
import { UcdModels } from './ucd-models.js';

/**
 * Deserializer library allocated by {@link UcdCompiler#bootstrap compiler}.
 *
 * @typeParam TModels - Compiled models record type.
 */
export class UcdLib<out TModels extends UcdModels = UcdModels> extends UcrxLib {
  readonly #schemaIndex: UccSchemaIndex;
  readonly #models: UcdSchemaConfigs<TModels>;

  readonly #options: UcdLib.Options<TModels>;

  readonly #deserializers = new Map<string, UcdFunction>();
  readonly #defaultEntities: EsSnippet;
  readonly #defaultFormats: EsSnippet;
  readonly #defaultMeta: EsSnippet;
  #onMeta?: EsSnippet;

  constructor(bundle: EsBundle, options: UcdLib.Options<TModels>);
  constructor({ ns }: EsBundle, options: UcdLib.Options<TModels>) {
    const { schemaIndex, models, exportDefaults, entities, formats, meta } = options;

    super(options);

    this.#schemaIndex = schemaIndex;
    this.#options = options;
    this.#models = this.#createModels(models);

    const exportNs = exportDefaults ? ns : undefined;

    this.#defaultEntities = entities(exportNs);
    this.#defaultFormats = formats(exportNs);
    this.#defaultMeta = meta(exportNs);

    this.#declareDeserializers(ns);
  }

  #createModels(models: TModels): UcdSchemaConfigs<TModels> {
    return Object.fromEntries(
      Object.entries(models).map(([externalName, entry]) => [
        externalName,
        {
          ...entry,
          model: ucSchema(entry.model),
        },
      ]),
    ) as UcdSchemaConfigs<TModels>;
  }

  #declareDeserializers(ns: EsNamespace): void {
    for (const [externalName, config] of Object.entries<UcdSchemaConfig>(this.#models)) {
      const fn = this.deserializerFor(config.model);

      ns.refer(fn.exportFn(this.#options.requestExport(externalName), config));
    }

    for (const { schema, whenCompiled } of this.#options.internalModels) {
      whenCompiled(this.deserializerFor(schema).ucrxClass);
    }
  }

  get defaultEntities(): EsSnippet {
    return this.#defaultEntities;
  }

  get defaultFormats(): EsSnippet {
    return this.#defaultFormats;
  }

  get defaultMeta(): EsSnippet {
    return this.#defaultMeta;
  }

  get onMeta(): EsSnippet {
    if (!this.#onMeta) {
      const { defaultMeta } = this;
      const { onMeta = UC_MODULE_DESERIALIZER_META.import('onMeta$byDefault') } = this.#options;

      if (defaultMeta === 'undefined') {
        return onMeta;
      }

      this.#onMeta = new EsCallable({ cx: {}, rx: {}, attr: {} }).lambda(
        ({ args: { cx, rx, attr } }) =>
          code => {
            code.line(
              'return ',
              esline`${defaultMeta}[${attr}]?.(${cx}, ${rx}, ${attr})`,
              ` ?? `,
              esline`${onMeta}(${cx}, ${rx}, ${attr})`,
            );
          },
      );
    }

    return this.#onMeta;
  }

  deserializerFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcdFunction<T, TSchema> {
    const schemaId = this.#schemaIndex.schemaId(schema);
    let deserializer = this.#deserializers.get(schemaId) as UcdFunction<T, TSchema> | undefined;

    if (!deserializer) {
      deserializer = new UcdFunction({
        lib: this as UcdLib,
        schema,
      });
      this.#deserializers.set(schemaId, deserializer);
    }

    return deserializer;
  }

  override ucrxClassFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(schema: TSchema): UcrxClass {
    return this.deserializerFor<T, TSchema>(schema).ucrxClass;
  }
}

export namespace UcdLib {
  export type Any<TModels extends UcdModels = UcdModels> = UcdLib<TModels>;

  export interface Options<out TModels extends UcdModels> extends UcrxLib.Options {
    readonly schemaIndex: UccSchemaIndex;
    readonly models: TModels;
    readonly internalModels: InternalModel[];
    requestExport(externalName: string): UcdFunction.ExportRequest;
    entities(this: void, exportNs?: EsNamespace): EsSnippet;
    formats(this: void, exportNs?: EsNamespace): EsSnippet;
    meta(this: void, exportNs?: EsNamespace): EsSnippet;
    onMeta?: EsSnippet | undefined;
    readonly exportDefaults?: boolean | undefined;
  }

  export interface InternalModel<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {
    readonly schema: UcSchema;
    whenCompiled(this: void, ucrxClass: UcrxClass<UcrxSignature.Args, T, TSchema>): void;
  }
}

type UcdSchemaConfigs<TModels extends UcdModels> = {
  readonly [externalName in keyof TModels]: UcdSchemaConfig<
    UcdModels.ModelOf<TModels[externalName]>
  >;
};

type UcdSchemaConfig<TModel extends UcModel = UcModel> = UcdModels.Entry<UcSchema.Of<TModel>>;
