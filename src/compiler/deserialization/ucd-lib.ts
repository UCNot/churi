import { lazyValue } from '@proc7ts/primitives';
import { escapeJsString } from 'httongue';
import { CHURI_MODULE, DEFAULT_ENTITIES_MODULE } from '../../impl/module-names.js';
import { UcDeserializer } from '../../schema/uc-deserializer.js';
import { UcDataType, UcInfer, UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UcLexer } from '../../syntax/uc-lexer.js';
import { UcToken } from '../../syntax/uc-token.js';
import { UccCode, UccFragment, UccSource } from '../codegen/ucc-code.js';
import { UccInitLocation } from '../codegen/ucc-declarations.js';
import { UcSchema$Variant, ucUcSchemaVariant } from '../impl/uc-schema.variant.js';
import { UccLib } from '../mod.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcdEntityFeature } from './ucd-entity-feature.js';
import { UcdFunction } from './ucd-function.js';

/**
 * Deserializer library that {@link UcdLib#compileFactory compiles data models} into their deserialization functions.
 *
 * An {@link UcdSetup deserializer setup} expected to be used to configure and {@link UcdSetup#bootstrap bootstrap}
 * the library instance.
 *
 * @typeParam TModels - Compiled models record type.
 */
export class UcdLib<
  out TModels extends UcdLib.Models = UcdLib.Models,
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

  readonly #deserializers = new Map<string | UcDataType, Map<UcSchema$Variant, UcdFunction>>();
  #entityHandler?: string;

  constructor(options: UcdLib.Options<TModels, TMode>) {
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

    for (const [externalName, schema] of Object.entries<UcSchema>(this.#models)) {
      const fn = this.deserializerFor(schema);

      this.#declareDeserializer(fn, externalName);
    }
  }

  get mode(): TMode {
    return this.#options.mode;
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

  #declareDeserializer(fn: UcdFunction, externalName: string): void {
    const { opaqueUcrx } = this;

    const input = this.mode === 'async' ? fn.vars.stream : fn.vars.input;
    const options = fn.vars.options;

    this.declarations.declareFunction(
      externalName,
      [this.mode === 'async' ? fn.vars.stream : fn.vars.input, options],
      () => code => {
        code.write(`const { onError, onEntity = ${this.entityHandler} } = ${options} ?? {};`);
        if (opaqueUcrx) {
          code
            .write(`${options} = {`)
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
          code.write(`${options} = { onError, onEntity };`);
        }
        code.write(fn.toUcDeserializer(input, options));
      },
      {
        async: this.mode === 'async',
        exported: true,
        bindArgs:
          this.mode === 'async'
            ? {
                [fn.vars.stream]: fn.vars.stream,
                [options]: options,
              }
            : {
                [fn.vars.input]: fn.vars.input,
                [options]: options,
              },
      },
    );
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

  compileFactory(): UcdLib.Factory<TModels, TMode> {
    const module = this.compile('factory');

    return {
      lib: this,
      toCode: module.toCode,
      toExports: () => this.#toDeserializers(module),
    };
  }

  async #toDeserializers(
    module: UcdLib.Compiled<TModels>,
  ): Promise<UcdLib.Exports<TModels, TMode>> {
    const text = await module.toText();

    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = Function(text) as () => Promise<UcdLib.Exports<TModels, TMode>>;

    return await factory();
  }

  compile(format: UccLib.Format = 'mjs'): UcdLib.Compiled<TModels> {
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
    if (format === 'factory') {
      return code => {
        code.write('return (async () => {').indent(this.#toBody(format)).write('})();');
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

export namespace UcdLib {
  export type Any<TModels extends Models = Models> = UcdLib<TModels, UcDeserializer.Mode>;

  export interface Options<out TModels extends Models, out TMode extends UcDeserializer.Mode>
    extends UcrxLib.Options {
    readonly models: TModels;
    readonly mode: TMode;
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

  export type Exports<
    TModels extends Models,
    TMode extends UcDeserializer.Mode,
  > = TMode extends 'async'
    ? AsyncExports<TModels>
    : TMode extends 'sync'
    ? SyncExports<TModels>
    : UniversalExports<TModels>;

  export type UniversalExports<TModels extends Models> = {
    readonly [reader in keyof TModels]: UcDeserializer<UcInfer<TModels[reader]>>;
  };

  export type AsyncExports<TModels extends Models> = {
    readonly [reader in keyof TModels]: UcDeserializer.Async<UcInfer<TModels[reader]>>;
  };

  export type SyncExports<TModels extends Models> = {
    readonly [reader in keyof TModels]: UcDeserializer.Sync<UcInfer<TModels[reader]>>;
  };

  export interface Factory<out TModels extends Models, out TMode extends UcDeserializer.Mode>
    extends UccFragment {
    readonly lib: UcdLib<TModels, TMode>;
    toExports(): Promise<Exports<TModels, TMode>>;
  }

  export interface Compiled<out TModels extends Models> extends UccFragment {
    readonly lib: UcdLib.Any<TModels>;
    toText(): Promise<string>;
  }
}
