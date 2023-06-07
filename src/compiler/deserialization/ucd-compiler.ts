import { asArray, mayHaveProperties } from '@proc7ts/primitives';
import {
  EsBundle,
  EsEvaluationOptions,
  EsGenerationOptions,
  EsScopeSetup,
  EsSignature,
  EsSnippet,
  esEvaluate,
  esGenerate,
  esQuoteKey,
  esStringLiteral,
} from 'esgen';
import { UcDeserializer } from '../../mod.js';
import { UcInstructions } from '../../schema/uc-instructions.js';
import { UcDataType, UcInfer, UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UcToken } from '../../syntax/uc-token.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { UcrxLib } from '../rx/ucrx-lib.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxClassFactory } from '../rx/ucrx.class.js';
import { UcdEntityFeature } from './ucd-entity-feature.js';
import { UcdFeature, UcdSchemaFeature } from './ucd-feature.js';
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
> {

  readonly #options: UcdCompiler.Options<TModels, TMode>;
  readonly #enabled = new Set<UcdFeature>();
  readonly #uses = new Map<UcSchema['type'], UcdCompiler$FeatureUse>();
  #hasPendingInstructions = false;
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
    this.#options = options;
  }

  /**
   * Enables the given deserializer `feature`, unless enabled already.
   *
   * @param feature - Deserializer feature to enable.
   *
   * @returns `this` instance.
   */
  enable(feature: UcdFeature): this {
    if (!this.#enabled.has(feature)) {
      this.#enabled.add(feature);
      if ('configureDeserializer' in feature) {
        feature.configureDeserializer(this);
      } else if (feature === ucdSupportDefaults) {
        this.#enableDefault();
      } else {
        feature(this);
      }
    }

    return this;
  }

  #enableDefault(): void {
    if (this.#entities?.length) {
      // Custom entities registered already.
      ucdSupportDefaults(this);

      return;
    }

    ucdSupportDefaults(this);

    // Stop registering default entities.
    // Start registering custom ones.
    this.#defaultEntities = this.#entities;
    this.#entities = undefined;
  }

  /**
   * Applies model deserialization instructions.
   *
   * @typeParam T - Implied data type.
   * @param model - Target model.
   *
   * @returns `this` instance.
   */
  processModel<T>(model: UcModel<T>): this {
    const schema = ucSchema(model);
    const use = asArray(schema.with?.deserializer?.use);

    use.forEach(useFeature => this.#useFeature(schema, useFeature));

    return this;
  }

  #useFeature(schema: UcSchema, { from, feature }: UcInstructions.UseFeature): void {
    const useId = `${ucSchemaSymbol(schema)}::${from}::${feature}`;

    if (!this.#uses.has(useId)) {
      this.#hasPendingInstructions = true;
      this.#uses.set(useId, new UcdCompiler$FeatureUse(schema, from, feature));
    }
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
    return await esGenerate(
      {
        ...options,
        setup: [...asArray(options.setup), await this.bootstrap()],
      },
      this.#initLib(),
    );
  }

  /**
   * Generates serialization code and evaluates it.
   *
   * @param options - Code evaluation options.
   *
   * @returns Promise resolved to deserializers exported from generated module.
   */
  async evaluate(options: EsEvaluationOptions = {}): Promise<UcdExports<TModels, TMode>> {
    return (await esEvaluate(
      {
        ...options,
        setup: [...asArray(options.setup), await this.bootstrap()],
      },
      this.#initLib(),
    )) as UcdExports<TModels, TMode>;
  }

  #initLib(): EsSnippet {
    return (code, scope) => {
      code.write(scope.get(UcdLib).init());
    };
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
    await this.#init();

    const { mode = 'universal' as TMode } = this.#options;

    return {
      ...this.#options,
      mode,
      entities: this.#entities,
      methods: this.#methods,
      ucrxClassFactoryFor: this.#ucrxClassFactoryFor.bind(this),
    };
  }

  async #init(): Promise<void> {
    this.#enableDefaultFeatures();
    this.#collectInstructions();
    await this.#processInstructions();
    this.#enableExplicitFeatures();
    await this.#processInstructions(); // More instructions may be added by explicit features.
  }

  #enableDefaultFeatures(): void {
    const { features } = this.#options;

    if (!features) {
      this.enable(ucdSupportDefaults);
    }
  }

  #collectInstructions(): void {
    const { models } = this.#options;

    Object.values(models).forEach(model => {
      this.processModel(model);
    });
  }

  async #processInstructions(): Promise<void> {
    while (this.#hasPendingInstructions) {
      this.#hasPendingInstructions = false;
      await Promise.all([...this.#uses.values()].map(async use => await use.enable(this)));
    }
  }

  #enableExplicitFeatures(): void {
    const { features } = this.#options;

    asArray(features).forEach(feature => {
      this.enable(feature);
    });
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
    readonly features?: UcdFeature | readonly UcdFeature[] | undefined;
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

class UcdCompiler$FeatureUse {

  readonly #schema: UcSchema;
  readonly #from: string;
  readonly #name: string;
  #enabled = false;

  constructor(schema: UcSchema, from: string, name: string) {
    this.#schema = schema;
    this.#from = from;
    this.#name = name;
  }

  async enable(compiler: UcdCompiler.Any): Promise<void> {
    if (this.#enabled) {
      return;
    }

    this.#enabled = true;

    const { [this.#name]: feature }: { [name: string]: UcdFeature | UcdSchemaFeature } =
      await import(this.#from);

    if (mayHaveProperties(feature)) {
      let configured = false;

      if ('configureDeserializer' in feature) {
        compiler.enable(feature);
        configured = true;
      }
      if ('configureSchemaDeserializer' in feature) {
        feature.configureSchemaDeserializer(compiler, this.#schema);
        configured = true;
      }

      if (configured) {
        return;
      }

      if (typeof feature === 'function') {
        (feature as UcdSchemaFeature.Function)(compiler, this.#schema);

        return;
      }
    }

    if (feature === undefined) {
      throw new ReferenceError(`No such deserializer feature: ${this}`);
    }

    throw new ReferenceError(`Not a deserializer feature: ${this}`);
  }

  toString(): string {
    return `import(${esStringLiteral(this.#from)}).${esQuoteKey(this.#name)}`;
  }

}
