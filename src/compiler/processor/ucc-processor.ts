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
import { UccSetup } from './ucc-setup.js';

/**
 * Abstract schema processor.
 *
 * Supports processing {@link UccFeature features}.
 *
 * @typeParam TSetup - Schema processing setup type.
 */
export abstract class UccProcessor<in out TSetup extends UccSetup<TSetup>>
  implements UccSetup<TSetup> {

  readonly #schemaIndex: UccSchemaIndex;
  readonly #models: readonly UcModel[] | undefined;
  readonly #features: readonly UccFeature<TSetup, void>[] | undefined;
  readonly #configs = new Map<UccFeature<TSetup, never>, () => UccConfig<never>>();
  readonly #uses = new Map<UcSchema['type'], UccProcessor$FeatureUse<TSetup>>();
  #setup?: TSetup;
  #hasPendingInstructions = false;

  /**
   * Constructs schema processor.
   *
   * @param init - Processor initialization options.
   */
  constructor(init: UccProcessorInit<TSetup>);
  constructor({ processors, presentations = [], models, features }: UccProcessorInit<TSetup>) {
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

  enable<TOptions>(feature: UccFeature<TSetup, TOptions>, options?: TOptions): this {
    let getConfig = this.#configs.get(feature) as (() => UccConfig<TOptions>) | undefined;

    if (!getConfig) {
      getConfig = lazyValue(() => this.createConfig(this.#getSetup(), feature));
      this.#configs.set(feature, getConfig);
    }

    this.configure(getConfig(), options!, {});

    return this;
  }

  #getSetup(): TSetup {
    return (this.#setup ??= this.createSetup());
  }

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
    let use = this.#uses.get(useId) as UccProcessor$FeatureUse<TSetup, TOptions> | undefined;

    if (!use) {
      this.#hasPendingInstructions = true;
      use = new UccProcessor$FeatureUse(schema, from, feature);
      this.#uses.set(useId, use as UccProcessor$FeatureUse<TSetup>);
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
          async use => await use.enableIn(
              schema => this.createSchemaSetup(schema),
              (config, options, context) => this.configure(config, options, context),
            ),
        ),
      );
    }
  }

  #enableExplicitFeatures(): void {
    this.#features?.forEach(feature => {
      this.enable(feature, undefined);
    });
  }

  /**
   * Creates processing setup for the {@link UccFeature features}.
   */
  protected abstract createSetup(): TSetup;

  /**
   * Creates processing setup for {@link UccSchemaFeature schema-specific feature}.
   *
   * @param schema - Target schema.
   */
  protected abstract createSchemaSetup(schema: UcSchema): TSetup;

  /**
   * Creates schema processing configuration for just {@link enable enabled} `feature`.
   *
   * @param setup - Schema processing setup.
   * @param feature - Enabled feature.
   *
   * @returns Schema processing configuration.
   */
  protected createConfig<TOptions>(
    setup: TSetup,
    feature: UccFeature<TSetup, TOptions>,
  ): UccConfig<TOptions> {
    return 'uccProcess' in feature ? feature.uccProcess(setup) : feature(setup);
  }

  /**
   * Configures feature.
   *
   * @param config - Schema processing configuration.
   * @param options - Configuration options.
   * @param context - Configuration context.
   */
  protected configure<TOptions>(
    config: UccConfig<TOptions>,
    options: TOptions,
    context: UccConfigContext,
  ): void {
    config.configure(options, context);
  }

}

/**
 * Schema {@link UccProcessor processor} initialization options.
 *
 * @typeParam TSetup - Schema processing setup type.
 */
export interface UccProcessorInit<TSetup extends UccSetup<TSetup>> {
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
  readonly features?: UccFeature<TSetup, void> | readonly UccFeature<TSetup, void>[] | undefined;
}

class UccProcessor$FeatureUse<in TSetup extends UccSetup<TSetup>, TOptions = unknown> {

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

  async enableIn(
    createSetup: (schema: UcSchema) => TSetup,
    configure: (config: UccConfig<TOptions>, options: TOptions, context: UccConfigContext) => void,
  ): Promise<void> {
    if (this.#enabled) {
      return;
    }

    this.#enabled = true;

    const {
      [this.#name]: feature,
    }: { [name: string]: UccFeature<TSetup, unknown> | UccSchemaFeature<TSetup, unknown> } =
      await import(this.#from);

    if (mayHaveProperties(feature)) {
      let configured = false;

      const setup = createSetup(this.#schema);

      if ('uccProcess' in feature) {
        for (const [options] of this.#options) {
          setup.enable(feature, options);
        }
        configured = true;
      }
      if ('uccProcessSchema' in feature) {
        this.#configure(feature.uccProcessSchema(setup, this.#schema), configure);
        configured = true;
      }

      if (configured) {
        return;
      }

      if (typeof feature === 'function') {
        this.#configure(feature(setup, this.#schema), configure);

        return;
      }
    }

    if (feature === undefined) {
      throw new ReferenceError(`No such schema processing feature: ${this}`);
    }

    throw new ReferenceError(`Not a schema processing feature: ${this}`);
  }

  #configure(
    config: UccConfig<TOptions>,
    configure: (config: UccConfig<TOptions>, options: TOptions, context: UccConfigContext) => void,
  ): void {
    for (const [options, context] of this.#options) {
      configure(config, options, context);
    }
  }

  toString(): string {
    return `import(${esStringLiteral(this.#from)}).${esQuoteKey(this.#name)}`;
  }

}
