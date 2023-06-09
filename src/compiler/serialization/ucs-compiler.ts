import { asArray, mayHaveProperties } from '@proc7ts/primitives';
import {
  EsBundle,
  EsEvaluationOptions,
  EsGenerationOptions,
  EsScopeSetup,
  esEvaluate,
  esGenerate,
  esQuoteKey,
  esStringLiteral,
} from 'esgen';
import { UcInstructions } from '../../schema/uc-instructions.js';
import { UcDataType, UcInfer, UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UcSerializer } from '../../schema/uc-serializer.js';
import { ucSchemaSymbol } from '../impl/uc-schema-symbol.js';
import { ucsCheckConstraints } from '../impl/ucs-check-constraints.js';
import { UcsFeature, UcsSchemaFeature } from './ucs-feature.js';
import { UcsFunction } from './ucs-function.js';
import { UcsGenerator } from './ucs-generator.js';
import { UcsLib } from './ucs-lib.js';
import { ucsSupportDefaults } from './ucs-support-defaults.js';

/**
 * Compiler of schema {@link churi!UcSerializer serializers}.
 *
 * @typeParam TModels - Compiled models record type.
 */
export class UcsCompiler<TModels extends UcsModels = UcsModels> {

  readonly #options: UcsCompiler.Options<TModels>;
  readonly #enabled = new Set<UcsFeature<never>>();
  readonly #uses = new Map<UcSchema['type'], UcsCompiler$FeatureUse>();
  #hasPendingInstructions = false;
  readonly #generators = new Map<string | UcDataType, UcsGenerator>();

  /**
   * Starts serializer setup.
   *
   * @param options - Setup options.
   */
  constructor(options: UcsCompiler.Options<TModels>) {
    this.#options = options;
  }

  /**
   * Enables the given serializer `feature`, unless enabled already.
   *
   * @typeParam TOptions - Type of feature options.
   * @param feature - Feature to enable.
   * @param options - Feature options.
   *
   * @returns `this` instance.
   */
  enable<TOptions>(feature: UcsFeature<TOptions>, options: TOptions): this;

  /**
   * Enables the given serializer `feature` without additional options, unless enabled already.
   *
   * @param feature - Feature to enable.
   *
   * @returns `this` instance.
   */
  enable(feature: UcsFeature<void>): this;

  /**
   * Enables the given serializer `feature`, unless enabled already.
   *
   * @typeParam TOptions - Type of feature options.
   * @param feature - Feature to enable.
   * @param options - Feature options.
   *
   * @returns `this` instance.
   */
  enable<TOptions>(feature: UcsFeature<TOptions>, options?: TOptions): this {
    if (!this.#enabled.has(feature)) {
      this.#enabled.add(feature);
      if ('configureSerializer' in feature) {
        feature.configureSerializer(this, options!);
      } else {
        feature(this, options!);
      }
    }

    return this;
  }

  /**
   * Applies model serialization instructions.
   *
   * @param T - Implied data type.
   * @param model - Target model.
   *
   * @returns `this` instance.
   */
  processModel<T>(model: UcModel<T>): this {
    const schema = ucSchema(model);
    const use = asArray(schema.with?.serializer?.use);

    use.forEach(useFeature => this.#useFeature(schema, useFeature));

    return this;
  }

  #useFeature(schema: UcSchema, { from, feature, options }: UcInstructions.UseFeature): void {
    const useId = `${ucSchemaSymbol(schema)}::${from}::${feature}`;

    if (!this.#uses.has(useId)) {
      this.#hasPendingInstructions = true;
      this.#uses.set(useId, new UcsCompiler$FeatureUse(schema, from, feature, options));
    }
  }

  /**
   * Assigns serialization code generator for the given type.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   * @param type - Target type name or class.
   * @param generator - Assigned generator.
   *
   * @returns `this` instance.
   */
  useUcsGenerator<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    type: TSchema['type'],
    generator: UcsGenerator<T, TSchema>,
  ): this {
    this.#generators.set(type, (fn: UcsFunction, schema: TSchema, args) => {
      const onValue = generator(fn, schema, args);

      return onValue && ucsCheckConstraints(fn, schema, args.value, onValue);
    });

    return this;
  }

  /**
   * Generates serialization code.
   *
   * @param options - Code generation options.
   *
   * @returns Promise resolved to serializer module text.
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
  async evaluate(options: EsEvaluationOptions = {}): Promise<UcsExports<TModels>> {
    return (await esEvaluate({
      ...options,
      setup: [...asArray(options.setup), await this.bootstrap()],
    })) as UcsExports<TModels>;
  }

  /**
   * Bootstraps serializer library.
   *
   * Enables configured {@link UcsFeature serialization features}, bootstraps {@link bootstrapOptions library
   * options}, then creates library with that options.
   *
   * @returns Promise resolved to code bundle initialization setup.
   */
  async bootstrap(): Promise<EsScopeSetup<EsBundle>> {
    const options = await this.bootstrapOptions();

    return {
      esSetupScope(context) {
        context.set(UcsLib, new UcsLib(context.scope, options));
      },
    };
  }

  /**
   * Bootstraps serializer library options.
   *
   * Enables configured {@link UcsFeature serialization features}.
   *
   * @returns Promise resolved to serializer library options.
   */
  async bootstrapOptions(): Promise<UcsLib.Options<TModels>> {
    await this.#init();

    const { createSerializer = options => new UcsFunction(options) } = this.#options;

    return {
      ...this.#options,
      generatorFor: this.#generatorFor.bind(this),
      createSerializer,
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
      this.enable(ucsSupportDefaults);
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

  #generatorFor<T, TSchema extends UcSchema<T>>(
    type: TSchema['type'],
  ): UcsGenerator<T, TSchema> | undefined {
    return this.#generators.get(type) as UcsGenerator<T, TSchema> | undefined;
  }

}

export namespace UcsCompiler {
  export interface Options<TModels extends UcsModels> {
    readonly models: TModels;
    readonly features?: UcsFeature | readonly UcsFeature[] | undefined;

    createSerializer?<T, TSchema extends UcSchema<T>>(
      this: void,
      options: UcsFunction.Options<T, TSchema>,
    ): UcsFunction<T, TSchema>;
  }
}

export interface UcsModels {
  readonly [writer: string]: UcModel;
}

export type UcsExports<out TModels extends UcsModels> = {
  readonly [writer in keyof TModels]: UcSerializer<UcInfer<TModels[writer]>>;
};

class UcsCompiler$FeatureUse {

  readonly #schema: UcSchema;
  readonly #from: string;
  readonly #name: string;
  readonly #options: unknown;
  #enabled = false;

  constructor(schema: UcSchema, from: string, name: string, options: unknown) {
    this.#schema = schema;
    this.#from = from;
    this.#name = name;
    this.#options = options;
  }

  async enable(compiler: UcsCompiler): Promise<void> {
    if (this.#enabled) {
      return;
    }

    this.#enabled = true;

    const { [this.#name]: feature }: { [name: string]: UcsFeature | UcsSchemaFeature } =
      await import(this.#from);

    if (mayHaveProperties(feature)) {
      let configured = false;

      if ('configureSerializer' in feature) {
        compiler.enable(feature, this.#options);
        configured = true;
      }
      if ('configureSchemaSerializer' in feature) {
        feature.configureSchemaSerializer(compiler, this.#schema, this.#options);
        configured = true;
      }

      if (configured) {
        return;
      }

      if (typeof feature === 'function') {
        feature(compiler, this.#schema, this.#options);

        return;
      }
    }

    if (feature === undefined) {
      throw new ReferenceError(`No such serializer feature: ${this}`);
    }

    throw new ReferenceError(`Not a serializer feature: ${this}`);
  }

  toString(): string {
    return `import(${esStringLiteral(this.#from)}).${esQuoteKey(this.#name)}`;
  }

}
