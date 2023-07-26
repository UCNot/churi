import { asArray, lazyValue, mayHaveProperties } from '@proc7ts/primitives';
import { esQuoteKey, esStringLiteral } from 'esgen';
import {
  UcConstraints,
  UcFeatureConstraint,
  UcProcessorName,
} from '../../schema/uc-constraints.js';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UccConfig, UccConfigContext } from './ucc-config.js';
import { UccFeature } from './ucc-feature.js';
import { UccSchemaFeature } from './ucc-schema-feature.js';
import { UccSchemaIndex } from './ucc-schema-index.js';

/**
 * Abstract schema processor.
 *
 * Supports processing {@link UccFeature features}.
 *
 * @typeParam TProcessor - Type of this schema processor.
 */
export abstract class UccProcessor<in TProcessor extends UccProcessor<TProcessor>> {

  readonly #schemaIndex: UccSchemaIndex;
  readonly #models: readonly UcModel[] | undefined;
  readonly #features: readonly UccFeature<TProcessor, void>[] | undefined;
  readonly #configs = new Map<UccFeature<TProcessor, never>, () => UccConfig<never>>();
  readonly #uses = new Map<UcSchema['type'], UccProcessor$FeatureUse<TProcessor>>();
  #hasPendingInstructions = false;

  /**
   * Constructs schema processor.
   *
   * @param init - Processor initialization options.
   */
  constructor(init: UccProcessorInit<TProcessor>);
  constructor({ processors, presentations = [], models, features }: UccProcessorInit<TProcessor>) {
    this.#schemaIndex = new UccSchemaIndex(
      asArray<UcProcessorName>(processors),
      asArray<UcPresentationName>(presentations),
    );
    this.#models = models;
    this.#features = features && asArray(features);
  }

  get schemaIndex(): UccSchemaIndex {
    return this.#schemaIndex;
  }

  /**
   * Enables the given processing `feature`.
   *
   * @typeParam TOptions - Type of schema processing options.
   * @param feature - Feature to enable.
   * @param options - Processing options.
   *
   * @returns `this` instance.
   */
  enable<TOptions>(feature: UccFeature<TProcessor, TOptions>, options: TOptions): this;

  /**
   * Enables the given processing `feature` that does not require options.
   *
   * @typeParam TOptions - Type of schema processing options.
   * @param feature - Feature to enable.
   *
   * @returns `this` instance.
   */
  enable(feature: UccFeature<TProcessor, void>): this;

  /**
   * Enables the given processing `feature`.
   *
   * @typeParam TOptions - Type of schema processing options.
   * @param feature - Feature to enable.
   * @param options - Processing options.
   *
   * @returns `this` instance.
   */
  enable<TOptions>(feature: UccFeature<TProcessor, TOptions>, options?: TOptions): this {
    let getConfig = this.#configs.get(feature) as (() => UccConfig<TOptions>) | undefined;

    if (!getConfig) {
      getConfig = lazyValue(() => this.createConfig(feature));
      this.#configs.set(feature, getConfig);
    }

    getConfig().configure(options!, {});

    return this;
  }

  /**
   * Creates schema processing configuration for just {@link enable enabled} `feature`.
   *
   * @param feature - Enabled feature.
   *
   * @returns Schema processing configuration.
   */
  protected createConfig<TOptions>(feature: UccFeature<TProcessor, TOptions>): UccConfig<TOptions> {
    return 'uccProcess' in feature
      ? feature.uccProcess(this as unknown as TProcessor)
      : feature(this as unknown as TProcessor);
  }

  /**
   * Applies model processing instructions specified as its {@link churi!UcSchema#where constraints}.
   *
   * @typeParam T - Implied data type.
   * @param model - Target model.
   *
   * @returns `this` instance.
   */
  processModel<T>(model: UcModel<T>): this {
    const schema = ucSchema(model);

    this.#applyConstraints<T>(schema, schema.where, {});
    for (const within of this.schemaIndex.listPresentations(schema.within)) {
      this.#applyConstraints(schema, schema.within![within], { within });
    }

    return this;
  }

  #applyConstraints<T>(
    schema: UcSchema<T>,
    constraints: UcConstraints<T> | undefined,
    context: UccConfigContext,
  ): void {
    for (const processorName of this.schemaIndex.processors) {
      asArray(constraints?.[processorName]).forEach(feature => this.#useFeature(schema, feature, context));
    }
  }

  #useFeature<TOptions>(
    schema: UcSchema,
    { use: feature, from, with: options }: UcFeatureConstraint,
    context: UccConfigContext,
  ): void {
    const useId = `${this.schemaIndex.schemaId(schema)}::${from}::${feature}`;
    let use = this.#uses.get(useId) as UccProcessor$FeatureUse<TProcessor, TOptions> | undefined;

    if (!use) {
      this.#hasPendingInstructions = true;
      use = new UccProcessor$FeatureUse(schema, from, feature);
      this.#uses.set(useId, use);
    }

    use.configure(options as TOptions, context);
  }

  protected async processInstructions(): Promise<void> {
    this.#collectInstructions();
    await this.#processInstructions();
    this.#enableExplicitFeatures();
    await this.#processInstructions(); // More instructions may be added by explicit features.
  }

  #collectInstructions(): void {
    this.#models?.forEach(model => {
      this.processModel(model);
    });
  }

  /**
   * Processes instructions supplied by {@link enable features} and {@link processModel modules}.
   */
  async #processInstructions(): Promise<void> {
    while (this.#hasPendingInstructions) {
      this.#hasPendingInstructions = false;
      await Promise.all(
        [...this.#uses.values()].map(
          async use => await use.enableIn(this as unknown as TProcessor),
        ),
      );
    }
  }

  #enableExplicitFeatures(): void {
    this.#features?.forEach(feature => {
      this.enable(feature, undefined);
    });
  }

}

/**
 * Schema {@link UccProcessor processor} initialization options.
 *
 * @typeParam TProcessor - Schema processor type.
 */
export interface UccProcessorInit<TProcessor extends UccProcessor<TProcessor>> {
  /**
   * Processor names within {@link churi!UcConstraints schema constraints}.
   */
  readonly processors: UcProcessorName | readonly UcProcessorName[];

  /**
   * Schema instance presentation names within {@link churi!UcPresentations presentation constraints}.
   *
   * All presentations enabled when missing or empty.
   */
  readonly presentations?: UcPresentationName | readonly UcPresentationName[] | undefined;

  /**
   * Models with constraints to extract processing instructions from.
   */
  readonly models?: readonly UcModel[] | undefined;

  /**
   * Additional schema processing features to enable and use.
   */
  readonly features?:
    | UccFeature<TProcessor, void>
    | readonly UccFeature<TProcessor, void>[]
    | undefined;
}

class UccProcessor$FeatureUse<in TProcessor extends UccProcessor<TProcessor>, TOptions = unknown> {

  readonly #schema: UcSchema;
  readonly #from: string;
  readonly #name: string;
  readonly #options: [TOptions, UccConfigContext][] = [];
  #enabled = false;

  constructor(schema: UcSchema, from: string, name: string) {
    this.#schema = schema;
    this.#from = from;
    this.#name = name;
  }

  configure(options: TOptions, context: UccConfigContext): void {
    this.#options.push([options, context]);
  }

  async enableIn(processor: TProcessor): Promise<void> {
    if (this.#enabled) {
      return;
    }

    this.#enabled = true;

    const {
      [this.#name]: feature,
    }: { [name: string]: UccFeature<TProcessor, unknown> | UccSchemaFeature<TProcessor, unknown> } =
      await import(this.#from);

    if (mayHaveProperties(feature)) {
      let configured = false;

      if ('uccProcess' in feature) {
        for (const options of this.#options) {
          processor.enable(feature, options);
        }
        configured = true;
      }
      if ('uccProcessSchema' in feature) {
        this.#configure(feature.uccProcessSchema(processor, this.#schema));
        configured = true;
      }

      if (configured) {
        return;
      }

      if (typeof feature === 'function') {
        this.#configure(feature(processor, this.#schema));

        return;
      }
    }

    if (feature === undefined) {
      throw new ReferenceError(`No such schema processing feature: ${this}`);
    }

    throw new ReferenceError(`Not a schema processing feature: ${this}`);
  }

  #configure(config: UccConfig<TOptions>): void {
    for (const [options, context] of this.#options) {
      config.configure(options, context);
    }
  }

  toString(): string {
    return `import(${esStringLiteral(this.#from)}).${esQuoteKey(this.#name)}`;
  }

}
