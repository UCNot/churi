import {
  EsBundle,
  EsDeclarationContext,
  EsNamespace,
  EsSnippet,
  EsVarSymbol,
  esEscapeString,
  esline,
} from 'esgen';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { UcDataType, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UcLexer } from '../../syntax/uc-lexer.js';
import { UcToken } from '../../syntax/uc-token.js';
import { UC_MODULE_CHURI, UC_MODULE_DEFAULT_ENTITIES } from '../impl/uc-modules.js';
import { UcSchemaVariant, ucSchemaVariant } from '../impl/uc-schema-variant.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxClass } from '../rx/ucrx.class.js';
import { UcdModels } from './ucd-compiler.js';
import { UcdEntityFeature } from './ucd-entity-feature.js';
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

  readonly #models: {
    readonly [externalName in keyof TModels]: UcSchema.Of<TModels[externalName]>;
  };

  readonly #options: UcdLib.Options<TModels, TMode>;
  readonly #entities: UcdLib.EntityConfig[] | undefined;
  readonly #createDeserializer: Exclude<
    UcdLib.Options<TModels, TMode>['createDeserializer'],
    undefined
  >;

  readonly #deserializers = new Map<string | UcDataType, Map<UcSchemaVariant, UcdFunction>>();
  readonly #entityHandler: EsSnippet;

  constructor(bundle: EsBundle, options: UcdLib.Options<TModels, TMode>);
  constructor({ ns }: EsBundle, options: UcdLib.Options<TModels, TMode>) {
    const { models, entities, createDeserializer = options => new UcdFunction(options) } = options;

    super(options);

    this.#options = options;
    this.#entities = entities;
    this.#models = this.#createModels(models);
    this.#createDeserializer = createDeserializer;
    this.#entityHandler = this.#createEntityHandler(ns);
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

  #createEntityHandler(ns: EsNamespace): EsSnippet {
    const { exportEntityHandler } = this.#options;
    const entities = this.#entities;

    if (!entities) {
      // Use precompiled entity handler.
      return UC_MODULE_DEFAULT_ENTITIES.import('onEntity$byDefault');
    }

    if (!entities.length) {
      // No entities supported.
      return 'undefined';
    }

    // Generate custom entity handler.
    const entityHandler = new EsVarSymbol('onEntity$byDefault', {
      declare: {
        at: exportEntityHandler ? 'exports' : 'bundle',
        value: context => code => {
          code.write(this.#registerEntities(context));
        },
      },
    });

    return exportEntityHandler ? ns.refer(entityHandler) : entityHandler;
  }

  #registerEntities({ refer }: EsDeclarationContext): EsSnippet {
    const EntityUcrxHandler = UC_MODULE_CHURI.import('EntityUcrxHandler');

    return code => {
      code.write(esline`new ${EntityUcrxHandler}()`).indent(code => {
        this.#entities!.forEach(({ entity, feature, prefix }) => {
          if (typeof entity === 'string') {
            entity = UcLexer.scan(entity);
          }

          const tokenArray =
            '['
            + entity
              .map(token => typeof token === 'number' ? token.toString() : `'${esEscapeString(token)}'`)
              .join(', ')
            + ']';

          code.write(
            feature({
              lib: this,
              register: entityRx => code => {
                code.line(prefix ? '.addPrefix(' : '.addEntity(', tokenArray, ', ', entityRx, ')');
              },
              refer,
            }),
          );
        });
      }, '.toRx()');
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

  get entityHandler(): EsSnippet {
    return this.#entityHandler;
  }

  deserializerFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcdFunction<T, TSchema> {
    const { id = schema.type } = schema;
    const variant = ucSchemaVariant(schema);

    let variants = this.#deserializers.get(id);

    if (!variants) {
      variants = new Map();
      this.#deserializers.set(id, variants);
    }

    let deserializer = variants.get(variant) as UcdFunction<T, TSchema> | undefined;

    if (!deserializer) {
      deserializer = this.#createDeserializer({
        lib: this as UcdLib,
        schema,
      });
      variants.set(variant, deserializer);
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
    readonly models: TModels;
    readonly mode: TMode;
    readonly entities?: EntityConfig[] | undefined;
    readonly exportEntityHandler?: boolean | undefined;

    createDeserializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcdFunction.Options<T, TSchema>,
    ): UcdFunction<T, TSchema>;
  }

  export interface EntityConfig {
    readonly entity: string | readonly UcToken[];
    readonly feature: UcdEntityFeature;
    readonly prefix?: boolean;
  }
}
