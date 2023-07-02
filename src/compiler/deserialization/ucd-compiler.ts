import { asArray, noop } from '@proc7ts/primitives';
import {
  EsBundle,
  EsEvaluationOptions,
  EsGenerationOptions,
  EsScopeSetup,
  EsSnippet,
  esEvaluate,
  esGenerate,
} from 'esgen';
import { UcDeserializer } from '../../mod.js';
import { UcInfer, UcModel, UcSchema } from '../../schema/uc-schema.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UccFeature } from '../processor/ucc-feature.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxProcessor } from '../rx/ucrx-processor.js';
import { UcdDefaultsFeature } from './ucd-defaults-feature.js';
import { UcdFunction } from './ucd-function.js';
import { UcdLib } from './ucd-lib.js';
import { ucdSupportDefaults } from './ucd-support-defaults.js';

/**
 * Compiler of schema {@link churi!UcDeserializer deserializers}.
 *
 * @typeParam TModels - Compiled models record type.
 * @typeParam TMode - Deserialization mode type.
 */
export class UcdCompiler<
  out TModels extends UcdModels = UcdModels,
  out TMode extends UcDeserializer.Mode = 'universal',
> extends UcrxProcessor<UcdCompiler.Any> {

  readonly #options: UcdCompiler.Options<TModels, TMode>;

  #defaultEntities: UcdLib.HandlerConfig[] | undefined;
  #entities: UcdLib.HandlerConfig[] | undefined = [];

  #defaultFormats: UcdLib.HandlerConfig[] | undefined;
  #formats: UcdLib.HandlerConfig[] | undefined = [];

  #defaultMeta: UcdLib.HandlerConfig[] | undefined;
  #meta: UcdLib.HandlerConfig[] | undefined = [];

  /**
   * Constructs deserializer compiler.
   *
   * @param options - Compiler options.
   */
  constructor(
    ...options: TMode extends 'sync' | 'async'
      ? [UcdCompiler.Options<TModels, TMode>]
      : [UcdCompiler.DefaultOptions<TModels>]
  );

  constructor(options: UcdCompiler.Options<TModels, TMode>) {
    const { models, features } = options;

    super({
      names: ['validator', 'deserializer'],
      models: Object.values(models),
      features,
    });

    this.#options = options;
  }

  protected override createConfig<TOptions>(
    feature: UccFeature<UcdCompiler.Any, TOptions>,
  ): UccConfig<TOptions> {
    if (feature === ucdSupportDefaults) {
      return this.#enableDefault() as UccConfig<TOptions>;
    }

    return super.createConfig(feature);
  }

  #enableDefault(): UccConfig {
    const defaultConfig = ucdSupportDefaults(this);

    if (this.#entities?.length || this.#formats?.length || this.#meta?.length) {
      // Custom handlers registered already.
      return defaultConfig;
    }

    // Stop registering default handlers.
    // Start registering custom ones.
    defaultConfig.configure();

    this.#defaultEntities = this.#entities;
    this.#entities = undefined;

    this.#defaultFormats = this.#formats;
    this.#formats = [];

    this.#defaultMeta = this.#meta;
    this.#meta = [];

    return { configure: noop };
  }

  /**
   * Configures entity handler.
   *
   * @param entity - Matching entity name.
   * @param feature - Entity support feature.
   *
   * @returns `this` instance.
   */
  handleEntity(entity: string, feature: UcdDefaultsFeature): this {
    this.#initEntities().push({ key: entity, feature });

    return this;
  }

  #initEntities(): UcdLib.HandlerConfig[] {
    return (this.#entities ??= this.#defaultEntities)!;
  }

  /**
   * Configures data format handler.
   *
   * @param format - Matching format name.
   * @param feature - Format support feature.
   *
   * @returns `this` instance.
   */
  handleFormat(format: string, feature: UcdDefaultsFeature): this {
    this.#initFormats().push({ key: format, feature });

    return this;
  }

  #initFormats(): UcdLib.HandlerConfig[] {
    return (this.#formats ??= this.#defaultFormats)!;
  }

  /**
   * Configures metadata attribute handler.
   *
   * @param attribute - Matching metadata attribute name.
   * @param feature - Metadata support feature.
   *
   * @returns `this` instance.
   */
  handleMeta(attribute: string, feature: UcdDefaultsFeature): this {
    this.#initMeta().push({ key: attribute, feature });

    return this;
  }

  #initMeta(): UcdLib.HandlerConfig[] {
    return (this.#meta ??= this.#defaultMeta)!;
  }

  /**
   * Generates deserialization code.
   *
   * @param options - Code generation options.
   * @param snippets - Additional code snippets.
   *
   * @returns Promise resolved to deserializer module text.
   */
  async generate(options: EsGenerationOptions = {}, ...snippets: EsSnippet[]): Promise<string> {
    return await esGenerate(
      {
        ...options,
        setup: [...asArray(options.setup), await this.bootstrap()],
      },
      ...snippets,
    );
  }

  /**
   * Generates serialization code and evaluates it.
   *
   * @param options - Code evaluation options.
   * @param snippets - Additional code snippets.
   *
   * @returns Promise resolved to deserializers exported from generated module.
   */
  async evaluate(
    options: EsEvaluationOptions = {},
    ...snippets: EsSnippet[]
  ): Promise<UcdExports<TModels, TMode>> {
    return (await esEvaluate(
      {
        ...options,
        setup: [...asArray(options.setup), await this.bootstrap()],
      },
      ...snippets,
    )) as UcdExports<TModels, TMode>;
  }

  /**
   * Bootstraps deserializer library.
   *
   * Enables configured {@link enable deserialization features}, bootstraps {@link bootstrapOptions library options},
   * then creates library with that options.
   *
   * @returns Promise resolved to bundle setup.
   */
  async bootstrap(): Promise<EsScopeSetup<EsBundle>> {
    const options = await this.bootstrapOptions();

    return {
      esSetupScope(context) {
        const lib = new UcdLib(context.scope, options);

        context.set(UcrxLib, lib);
        context.set(UcdLib, lib);
      },
    };
  }

  /**
   * Bootstraps deserializer library options.
   *
   * Enables configured {@link enable deserialization features}.
   *
   * @returns Promise resolved to deserializer library options.
   */
  async bootstrapOptions(): Promise<UcdLib.Options<TModels, TMode>> {
    this.#enableDefaultFeatures();
    await this.processInstructions();

    const { mode = 'universal' as TMode } = this.#options;

    return {
      ...this.#options,
      ...this.createUcrxLibOptions(),
      schemaIndex: this.schemaIndex,
      mode,
      entities: this.#entities,
      formats: this.#formats,
      meta: this.#meta,
    };
  }

  #enableDefaultFeatures(): void {
    const { features } = this.#options;

    if (!features) {
      this.enable(ucdSupportDefaults);
    }
  }

}

export interface UcdModels {
  readonly [reader: string]: UcModel;
}

export type UcdExports<
  TModels extends UcdModels,
  TMode extends UcDeserializer.Mode,
> = TMode extends 'async'
  ? UcdAsyncExports<TModels>
  : TMode extends 'sync'
  ? UcdSyncExports<TModels>
  : UcdUniversalExports<TModels>;

export type UcdUniversalExports<TModels extends UcdModels> = {
  readonly [reader in keyof TModels]: UcDeserializer<UcInfer<TModels[reader]>>;
};

export type UcdAsyncExports<TModels extends UcdModels> = {
  readonly [reader in keyof TModels]: UcDeserializer.Async<UcInfer<TModels[reader]>>;
};

export type UcdSyncExports<TModels extends UcdModels> = {
  readonly [reader in keyof TModels]: UcDeserializer.Sync<UcInfer<TModels[reader]>>;
};

export namespace UcdCompiler {
  export type Any = UcdCompiler<UcdModels, UcDeserializer.Mode>;

  export interface BaseOptions<out TModels extends UcdModels, out TMode extends UcDeserializer.Mode>
    extends Omit<UcrxLib.Options, 'methods'> {
    readonly models: TModels;
    readonly mode?: TMode | undefined;
    readonly features?:
      | UccFeature<UcdCompiler.Any>
      | readonly UccFeature<UcdCompiler.Any>[]
      | undefined;
    readonly exportDefaults?: boolean | undefined;

    createDeserializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcdFunction.Options<T, TSchema>,
    ): UcdFunction<T, TSchema>;
  }

  export type DefaultOptions<TModels extends UcdModels> = BaseOptions<TModels, 'universal'>;

  export interface Options<out TModels extends UcdModels, out TMode extends UcDeserializer.Mode>
    extends BaseOptions<TModels, TMode> {
    readonly mode: TMode;
  }
}
