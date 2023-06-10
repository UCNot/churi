import { asArray, noop } from '@proc7ts/primitives';
import {
  EsBundle,
  EsEvaluationOptions,
  EsGenerationOptions,
  EsScopeSetup,
  EsSignature,
  esEvaluate,
  esGenerate,
} from 'esgen';
import { UcDeserializer } from '../../mod.js';
import { UcDataType, UcInfer, UcModel, UcSchema } from '../../schema/uc-schema.js';
import { UcToken } from '../../syntax/uc-token.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UccFeature } from '../processor/ucc-feature.js';
import { UccProcessor } from '../processor/ucc-processor.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxClassFactory } from '../rx/ucrx.class.js';
import { UcdEntityFeature } from './ucd-entity-feature.js';
import { UcdFunction } from './ucd-function.js';
import { UcdLib } from './ucd-lib.js';
import { ucdSupportDefaults } from './ucd-support-defaults.js';

/**
 * Compiler of schema {@link churi!UcDeserializer deserializers}.
 *
 * @typeParam TModels - Compiled models record type.
 */
export class UcdCompiler<
  out TModels extends UcdModels = UcdModels,
  out TMode extends UcDeserializer.Mode = 'universal',
> extends UccProcessor<UcdCompiler.Any> {

  readonly #options: UcdCompiler.Options<TModels, TMode>;
  readonly #types = new Map<string | UcDataType, UcrxClassFactory>();
  #defaultEntities: UcdLib.EntityConfig[] | undefined;
  #entities: UcdLib.EntityConfig[] | undefined = [];
  readonly #methods = new Set<UcrxMethod<any>>();

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
      name: 'deserializer',
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
    const config = ucdSupportDefaults(this);

    if (this.#entities?.length) {
      // Custom entities registered already.
      return config;
    }

    // Stop registering default entities.
    // Start registering custom ones.
    config.configure();
    this.#defaultEntities = this.#entities;
    this.#entities = undefined;

    return { configure: noop };
  }

  /**
   * Assigns {@link churi!Ucrx Ucrx} class to use for the given `type` deserialization.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   * @param type - Target type name or class.
   * @param factory - Ucrx class factory.
   *
   * @returns `this` instance.
   */
  useUcrxClass<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    type: TSchema['type'],
    factory: UcrxClassFactory<T, TSchema>,
  ): this {
    this.#types.set(type, factory);

    return this;
  }

  /**
   * Declares `method` to charge receiver template.
   *
   * @param method - Declaration of method to add to charge receiver template.
   *
   * @returns `this` instance.
   */
  declareUcrxMethod<TArg extends EsSignature.Args>(method: UcrxMethod<TArg>): this {
    this.#methods.add(method);

    return this;
  }

  /**
   * Configures entity handler.
   *
   * @param entity - Matching entity. Either string or array of entity tokens.
   * @param feature - Entity support feature.
   *
   * @returns `this` instance.
   */
  handleEntity(entity: string | readonly UcToken[], feature: UcdEntityFeature): this {
    this.#initEntities().push({ entity, feature });

    return this;
  }

  /**
   * Configures entity prefix handler.
   *
   * @param prefix - Matching entity prefix. Either string or array of entity tokens.
   * @param feature - Entity support feature.
   *
   * @returns `this` instance.
   */
  handleEntityPrefix(prefix: string | readonly UcToken[], feature: UcdEntityFeature): this;
  handleEntityPrefix(entity: string | readonly UcToken[], feature: UcdEntityFeature): this {
    this.#initEntities().push({ entity, feature, prefix: true });

    return this;
  }

  #initEntities(): UcdLib.EntityConfig[] {
    return (this.#entities ??= this.#defaultEntities)!;
  }

  /**
   * Generates deserialization code.
   *
   * @param options - Code generation options.
   *
   * @returns Promise resolved to deserializer module text.
   */
  async generate(options: EsGenerationOptions = {}): Promise<string> {
    return await esGenerate({
      ...options,
      setup: [...asArray(options.setup), await this.bootstrap()],
    });
  }

  /**
   * Generates serialization code and evaluates it.
   *
   * @param options - Code evaluation options.
   *
   * @returns Promise resolved to deserializers exported from generated module.
   */
  async evaluate(options: EsEvaluationOptions = {}): Promise<UcdExports<TModels, TMode>> {
    return (await esEvaluate({
      ...options,
      setup: [...asArray(options.setup), await this.bootstrap()],
    })) as UcdExports<TModels, TMode>;
  }

  /**
   * Bootstraps deserializer library.
   *
   * Enables configured {@link UcdFeature deserialization features}, bootstraps {@link bootstrapOptions library
   * options}, then creates library with that options.
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
   * Enables configured {@link UcdFeature deserialization features}.
   *
   * @returns Promise resolved to deserializer library options.
   */
  async bootstrapOptions(): Promise<UcdLib.Options<TModels, TMode>> {
    this.#enableDefaultFeatures();
    await this.processInstructions();

    const { mode = 'universal' as TMode } = this.#options;

    return {
      ...this.#options,
      mode,
      entities: this.#entities,
      methods: this.#methods,
      ucrxClassFactoryFor: this.#ucrxClassFactoryFor.bind(this),
    };
  }

  #enableDefaultFeatures(): void {
    const { features } = this.#options;

    if (!features) {
      this.enable(ucdSupportDefaults);
    }
  }

  #ucrxClassFactoryFor<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    schema: TSchema,
  ): UcrxClassFactory<T, TSchema> | undefined {
    return this.#types.get(schema.type) as UcrxClassFactory<T, TSchema> | undefined;
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
    readonly exportEntityHandler?: boolean | undefined;

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
