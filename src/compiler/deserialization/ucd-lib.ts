import { CHURI_MODULE, DEFAULT_ENTITIES_MODULE } from '../../impl/module-names.js';
import { escapeJsString } from 'httongue';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { UcDataType, UcInfer, UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UcLexer } from '../../syntax/uc-lexer.js';
import { UcToken } from '../../syntax/uc-token.js';
import { UccCode, UccFragment, UccSource } from '../codegen/ucc-code.js';
import { UccInitLocation } from '../codegen/ucc-declarations.js';
import { UcSchema$Variant, ucUcSchemaVariant } from '../impl/uc-schema.variant.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcdEntityFeature } from './ucd-entity-feature.js';
import { UcdFunction } from './ucd-function.js';

/**
 * Deserializer library that {@link UcdLib#compile compiles data models} into their deserialization functions.
 *
 * An {@link UcdSetup deserializer setup} expected to be used to configure and {@link UcdSetup#bootstrap bootstrap}
 * the library instance.
 *
 * @typeParam TModels - Compiled models record type.
 */
export class UcdLib<TModels extends UcdLib.Models = UcdLib.Models> extends UcrxLib {

  readonly #models: {
    readonly [externalName in keyof TModels]: UcSchema.Of<TModels[externalName]>;
  };

  readonly #options: UcdLib.Options<TModels>;
  readonly #entities: UcdLib.EntityConfig[] | undefined;
  readonly #createDeserializer: Exclude<UcdLib.Options<TModels>['createDeserializer'], undefined>;
  readonly #deserializers = new Map<string | UcDataType, Map<UcSchema$Variant, UcdFunction>>();
  #entityHandler?: string;

  constructor(options: UcdLib.Options<TModels>) {
    const { models, entities, createDeserializer = options => new UcdFunction(options) } = options;

    super({ ...options });

    this.#options = options;
    this.#entities = entities;
    this.#models = Object.fromEntries(
      Object.entries(models).map(([externalName, model]) => [externalName, ucSchema(model)]),
    ) as {
      readonly [externalName in keyof TModels]: UcSchema.Of<TModels[externalName]>;
    };

    this.#createDeserializer = createDeserializer;

    for (const schema of Object.values(this.#models)) {
      this.deserializerFor(schema);
    }
  }

  get entityHandler(): string {
    return (this.#entityHandler ??= this.#createEntityHandler());
  }

  #createEntityHandler(): string {
    const entities = this.#entities;

    if (!entities) {
      // Use precompiled entity handler.
      return this.import(DEFAULT_ENTITIES_MODULE, 'onEntity$byDefault');
    }

    if (!entities.length) {
      // No entities supported.
      return 'undefined';
    }

    // Generate custom entity handler.
    return this.declarations.declare('onEntity$byDefault', location => code => {
      code.write(this.createEntityHandler(location));
    });
  }

  createEntityHandler({ init, refer }: UccInitLocation): UccSource {
    const EntityUcrxHandler = this.import(CHURI_MODULE, 'EntityUcrxHandler');

    return init(code => {
      code.write(`new ${EntityUcrxHandler}()`).indent(code => {
        this.#entities!.forEach(({ entity, feature, prefix }) => {
          if (typeof entity === 'string') {
            entity = UcLexer.scan(entity);
          }

          const tokenArray =
            '['
            + entity
              .map(token => typeof token === 'number' ? token.toString() : `'${escapeJsString(token)}'`)
              .join(', ')
            + ']';

          code.write(
            feature({
              lib: this,
              register: entityRx => code => {
                code.inline(
                  prefix ? '.addPrefix(' : '.addEntity(',
                  tokenArray,
                  ', ',
                  entityRx,
                  ')',
                );
              },
              refer,
            }),
          );
        });
      }, '.toRx()');
    });
  }

  deserializerFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcdFunction<T, TSchema> {
    const { id = schema.type } = schema;
    const variant = ucUcSchemaVariant(schema);

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

  override ucrxTemplateFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcrxTemplate<T, TSchema> {
    return this.deserializerFor<T, TSchema>(schema).template;
  }

  ucrxTemplateFactoryFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcrxTemplate.Factory<T, TSchema> | undefined {
    return this.#options.ucrxTemplateFactoryFor?.(schema);
  }

  compile(mode: 'async'): UcdLib.AsyncCompiled<TModels>;
  compile(mode: 'sync'): UcdLib.SyncCompiled<TModels>;
  compile(mode?: UcDeserializer.Mode): UcdLib.Compiled<TModels>;

  compile(mode: UcDeserializer.Mode = 'all'): UcdLib.Compiled<TModels> {
    return {
      lib: this,
      toCode: () => this.#toFactoryCode(mode),
      toDeserializers: () => this.#toDeserializers(mode),
    };
  }

  #toFactoryCode(mode: UcDeserializer.Mode): UccSource {
    return code => {
      code
        .write('return (async () => {')
        .indent(
          this.imports.asDynamic(),
          '',
          this.declarations,
          '',
          this.#returnDeserializers(mode),
        )
        .write('})();');
    };
  }

  #returnDeserializers(mode: UcDeserializer.Mode): UccSource {
    return code => {
      code
        .write('return {')
        .indent(this.#declareDeserializers(mode, mode === 'async' ? 'async ' : '', ','))
        .write('};');
    };
  }

  async #toDeserializers(mode: UcDeserializer.Mode): Promise<UcdLib.Exports<TModels>> {
    const text = await new UccCode().write(this.#toFactoryCode(mode)).toText();

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = Function(text) as () => Promise<UcdLib.Exports<TModels>>;

    return await factory();
  }

  compileModule(mode: UcDeserializer.Mode = 'all'): UcdLib.Module<TModels> {
    return {
      lib: this,
      toCode: () => this.#toModuleCode(mode),
      toText: async () => await this.#toModuleText(mode),
    };
  }

  #toModuleCode(mode: UcDeserializer.Mode): UccSource {
    return code => {
      code.write(
        this.imports.asStatic(),
        '',
        this.declarations,
        '',
        this.#exportDeserializers(mode),
      );
    };
  }

  #exportDeserializers(mode: UcDeserializer.Mode): UccSource {
    return this.#declareDeserializers(
      mode,
      mode === 'async' ? 'export async function ' : 'export function ',
      '',
    );
  }

  #declareDeserializers(mode: UcDeserializer.Mode, fnPrefix: string, fnSuffix: string): UccSource {
    return code => {
      const { opaqueUcrx } = this;

      for (const [externalName, schema] of Object.entries(this.#models)) {
        const fn = this.deserializerFor(schema);
        const input = mode === 'async' ? fn.vars.stream : fn.vars.input;
        const options = fn.vars.options;

        code
          .write(
            `${fnPrefix}${externalName}(${input}, { onError, onEntity = ${this.entityHandler} } = {}) {`,
          )
          .indent(code => {
            if (opaqueUcrx) {
              code
                .write(`const ${options} = {`)
                .indent(code => {
                  code.write(
                    'onError,',
                    'onEntity,',
                    `opaqueRx: `
                      + opaqueUcrx.newInstance({
                        set: 'undefined',
                        context: 'undefined',
                      })
                      + ',',
                  );
                })
                .write('};');
            } else {
              code.write(`const ${options} = { onError, onEntity };`);
            }
            code.write(fn.toUcDeserializer(mode, input, options));
          })
          .write(`}${fnSuffix}`);
      }
    };
  }

  async #toModuleText(mode: UcDeserializer.Mode): Promise<string> {
    return await new UccCode().write(this.#toModuleCode(mode)).toText();
  }

}

export namespace UcdLib {
  export interface Options<TModels extends Models> extends UcrxLib.Options {
    readonly models: TModels;
    readonly entities?: EntityConfig[] | undefined;

    ucrxTemplateFactoryFor?<T, TSchema extends UcSchema<T> = UcSchema<T>>(
      this: void,
      schema: TSchema,
    ): UcrxTemplate.Factory<T, TSchema> | undefined;

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

  export interface Models {
    readonly [reader: string]: UcModel;
  }

  export type Exports<TModels extends Models> = {
    readonly [reader in keyof TModels]: UcDeserializer<UcInfer<TModels[reader]>>;
  };

  export type AsyncExports<TModels extends Models> = {
    readonly [reader in keyof TModels]: UcDeserializer.Async<UcInfer<TModels[reader]>>;
  };

  export type SyncExports<TModels extends Models> = {
    readonly [reader in keyof TModels]: UcDeserializer.Sync<UcInfer<TModels[reader]>>;
  };

  export interface Compiled<TModels extends Models> extends UccFragment {
    readonly lib: UcdLib<TModels>;
    toDeserializers(): Promise<Exports<TModels>>;
  }

  export interface AsyncCompiled<TModels extends Models> extends UccFragment {
    readonly lib: UcdLib<TModels>;
    toDeserializers(): Promise<AsyncExports<TModels>>;
  }

  export interface SyncCompiled<TModels extends Models> extends UccFragment {
    readonly lib: UcdLib<TModels>;
    toDeserializers(): Promise<SyncExports<TModels>>;
  }

  export interface Module<TModels extends Models> extends UccFragment {
    readonly lib: UcdLib<TModels>;
    toText(): Promise<string>;
  }
}
