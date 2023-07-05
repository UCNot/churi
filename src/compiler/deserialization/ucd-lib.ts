import { EsBundle, EsCallable, EsNamespace, EsSnippet, esline } from 'esgen';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UC_MODULE_DESERIALIZER_META } from '../impl/uc-modules.js';
import { UccSchemaIndex } from '../processor/ucc-schema-index.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';
import { UcdModels } from './ucd-compiler.js';
import { UcdExportSignature } from './ucd-export.signature.js';
import { UcdFunction } from './ucd-function.js';

/**
 * Deserializer library allocated by {@link UcdCompiler#bootstrap compiler}.
 *
 * @typeParam TModels - Compiled models record type.
 */
export class UcdLib<
  out TModels extends UcdModels = UcdModels,
  out TMode extends UcDeserializer.Mode = 'universal',
> extends UcrxLib {

  readonly #schemaIndex: UccSchemaIndex;
  readonly #models: {
    readonly [externalName in keyof TModels]: UcSchema.Of<TModels[externalName]>;
  };

  readonly #options: UcdLib.Options<TModels, TMode>;
  readonly #createDeserializer: Exclude<
    UcdLib.Options<TModels, TMode>['createDeserializer'],
    undefined
  >;

  readonly #deserializers = new Map<string, UcdFunction>();
  readonly #defaultEntities: EsSnippet;
  readonly #defaultFormats: EsSnippet;
  readonly #defaultMeta: EsSnippet;
  #onMeta: EsSnippet | undefined;

  constructor(bundle: EsBundle, options: UcdLib.Options<TModels, TMode>);
  constructor({ ns }: EsBundle, options: UcdLib.Options<TModels, TMode>) {
    const {
      schemaIndex,
      models,
      exportDefaults,
      entities,
      formats,
      meta,
      onMeta,
      createDeserializer = options => new UcdFunction(options),
    } = options;

    super(options);

    this.#schemaIndex = schemaIndex;
    this.#options = options;
    this.#models = this.#createModels(models);
    this.#createDeserializer = createDeserializer;

    const exportNs = exportDefaults ? ns : undefined;

    this.#defaultEntities = entities(exportNs);
    this.#defaultFormats = formats(exportNs);
    this.#defaultMeta = meta(exportNs);
    this.#onMeta = onMeta;

    this.#declareDeserializers(ns);
  }

  #createModels(models: TModels): {
    readonly [externalName in keyof TModels]: UcSchema.Of<TModels[externalName]>;
  } {
    return Object.fromEntries(
      Object.entries(models).map(([externalName, model]) => [externalName, ucSchema(model)]),
    ) as {
      readonly [externalName in keyof TModels]: UcSchema.Of<TModels[externalName]>;
    };
  }

  #declareDeserializers(ns: EsNamespace): void {
    for (const [externalName, schema] of Object.entries<UcSchema>(this.#models)) {
      const fn = this.deserializerFor(schema);

      ns.refer(fn.exportFn(externalName, UcdExportSignature));
    }

    for (const { schema, whenCompiled } of this.#options.internalModels) {
      whenCompiled(this.deserializerFor(schema).ucrxClass);
    }
  }

  get mode(): TMode {
    return this.#options.mode;
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
      const onMeta$byDefault = UC_MODULE_DESERIALIZER_META.import('onMeta$byDefault');

      if (defaultMeta === 'undefined') {
        return onMeta$byDefault;
      }

      this.#onMeta = new EsCallable({ cx: {}, rx: {}, attr: {} }).lambda(
        ({ args: { cx, rx, attr } }) => code => {
            code.line(
              esline`${defaultMeta}[${attr}]?.(${cx}, ${rx}, ${attr}})`,
              ` ?? `,
              esline`${onMeta$byDefault}(${cx}, ${rx}, ${attr})`,
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
      deserializer = this.#createDeserializer({
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
  export type Any<TModels extends UcdModels = UcdModels> = UcdLib<TModels, UcDeserializer.Mode>;

  export interface Options<out TModels extends UcdModels, out TMode extends UcDeserializer.Mode>
    extends UcrxLib.Options {
    readonly schemaIndex: UccSchemaIndex;
    readonly models: TModels;
    readonly internalModels: InternalModel[];
    readonly mode: TMode;
    entities(this: void, exportNs?: EsNamespace): EsSnippet;
    formats(this: void, exportNs?: EsNamespace): EsSnippet;
    meta(this: void, exportNs?: EsNamespace): EsSnippet;
    onMeta?: EsSnippet | undefined;
    readonly exportDefaults?: boolean | undefined;

    createDeserializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcdFunction.Options<T, TSchema>,
    ): UcdFunction<T, TSchema>;
  }

  export interface InternalModel<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {
    readonly schema: UcSchema;
    whenCompiled(this: void, ucrxClass: UcrxClass<UcrxSignature.Args, T, TSchema>): void;
  }
}
