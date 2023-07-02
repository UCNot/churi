import {
  EsBundle,
  EsDeclarationContext,
  EsNamespace,
  EsSnippet,
  EsVarSymbol,
  esMemberAccessor,
  esline,
} from 'esgen';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UC_MODULE_DESERIALIZER_DEFAULTS } from '../impl/uc-modules.js';
import { UccSchemaIndex } from '../processor/ucc-schema-index.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxClass } from '../rx/ucrx.class.js';
import { UcdModels } from './ucd-compiler.js';
import { UcdDefaultsFeature } from './ucd-defaults-feature.js';
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
  readonly #entities: UcdLib.HandlerConfig[] | undefined;
  readonly #formats: UcdLib.HandlerConfig[] | undefined = [];
  readonly #meta: UcdLib.HandlerConfig[] | undefined = [];
  readonly #createDeserializer: Exclude<
    UcdLib.Options<TModels, TMode>['createDeserializer'],
    undefined
  >;

  readonly #deserializers = new Map<string, UcdFunction>();
  readonly #defaultEntities: EsSnippet;
  readonly #defaultFormats: EsSnippet;
  readonly #defaultMeta: EsSnippet;

  constructor(bundle: EsBundle, options: UcdLib.Options<TModels, TMode>);
  constructor({ ns }: EsBundle, options: UcdLib.Options<TModels, TMode>) {
    const {
      schemaIndex,
      models,
      entities,
      formats,
      meta,
      createDeserializer = options => new UcdFunction(options),
    } = options;

    super(options);

    this.#schemaIndex = schemaIndex;
    this.#options = options;
    this.#entities = entities;
    this.#formats = formats;
    this.#meta = meta;
    this.#models = this.#createModels(models);
    this.#createDeserializer = createDeserializer;
    this.#defaultEntities = this.#createDefaults('defaultEntities', this.#entities, ns);
    this.#defaultFormats = this.#createDefaults('defaultFormats', this.#formats, ns);
    this.#defaultMeta = this.#createDefaults('defaultMeta', this.#meta, ns);
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

  #createDefaults(
    name: string,
    defaults: readonly UcdLib.HandlerConfig[] | undefined,
    ns: EsNamespace,
  ): EsSnippet {
    const { exportDefaults } = this.#options;

    if (!defaults) {
      // Use precompiled entity handler.
      return UC_MODULE_DESERIALIZER_DEFAULTS.import(name);
    }

    if (!defaults.length) {
      // No entities supported.
      return 'undefined';
    }

    // Generate custom entity handler.
    const defaultEntities = new EsVarSymbol(name, {
      declare: {
        at: exportDefaults ? 'exports' : 'bundle',
        value: context => this.#registerDefaults(defaults, context),
      },
    });

    return exportDefaults ? ns.refer(defaultEntities) : defaultEntities;
  }

  #registerDefaults(
    defaults: readonly UcdLib.HandlerConfig[],
    { refer }: EsDeclarationContext,
  ): EsSnippet {
    return code => {
      code.multiLine(code => {
        code
          .write(`{`)
          .indent(code => {
            defaults.forEach(({ key, feature }) => {
              code.write(
                feature({
                  lib: this,
                  register: handler => esline`${esMemberAccessor(key).key}: ${handler},`,
                  refer,
                }),
              );
            });
          })
          .write('}');
      });
    };
  }

  #declareDeserializers(ns: EsNamespace): void {
    for (const [externalName, schema] of Object.entries<UcSchema>(this.#models)) {
      const fn = this.deserializerFor(schema);

      ns.refer(fn.exportFn(externalName, UcdExportSignature));
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
    readonly mode: TMode;
    readonly entities?: HandlerConfig[] | undefined;
    readonly formats?: HandlerConfig[] | undefined;
    readonly meta?: HandlerConfig[] | undefined;
    readonly exportDefaults?: boolean | undefined;

    createDeserializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcdFunction.Options<T, TSchema>,
    ): UcdFunction<T, TSchema>;
  }

  export interface HandlerConfig {
    readonly key: string;
    readonly feature: UcdDefaultsFeature;
  }
}
