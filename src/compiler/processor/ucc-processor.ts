import { asArray, isPresent, lazyValue } from '@proc7ts/primitives';
import {
  UcConstraints,
  UcFeatureConstraint,
  UcProcessorName,
} from '../../schema/uc-constraints.js';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UccProcessor$CapabilityActivation } from './impl/ucc-processor.capability-activation.js';
import { UccProcessor$ConstraintConfig } from './impl/ucc-processor.constraint-config.js';
import { UccProcessor$FeatureUse } from './impl/ucc-processor.feature-use.js';
import { UccProcessor$Profiler } from './impl/ucc-processor.profiler.js';
import { UccCapability } from './ucc-capability.js';
import { UccConfig } from './ucc-config.js';
import { UccFeature } from './ucc-feature.js';
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
  readonly #capabilities: readonly UccCapability<TSetup>[] | undefined;
  readonly #models: readonly UcModel[] | undefined;
  readonly #features: readonly UccFeature<TSetup, void>[] | undefined;
  readonly #getSetup = lazyValue(() => this.createSetup());
  readonly #profiler = new UccProcessor$Profiler<TSetup>(this);
  readonly #uses = new Map<UcSchema['type'], UccProcessor$FeatureUse<TSetup>>();

  #hasPendingInstructions = false;

  /**
   * Constructs schema processor.
   *
   * @param options - Schema processing options.
   */
  constructor(options: UccProcessor.Options<TSetup>);
  constructor({
    processors,
    presentations = [],
    capabilities,
    models,
    features,
  }: UccProcessor.Options<TSetup>) {
    this.#schemaIndex = new UccSchemaIndex(
      asArray<UcProcessorName>(processors),
      asArray<UcPresentationName>(presentations),
    );
    this.#capabilities = capabilities && asArray(capabilities);
    this.#models =
      models
      && Object.values<UccProcessor.Entry | undefined>(models)
        .filter(isPresent)
        .map(({ model }: UccProcessor.Entry) => model);
    this.#features = features && asArray(features);
  }

  get setup(): TSetup {
    return this.#getSetup();
  }

  get schemaIndex(): UccSchemaIndex {
    return this.#schemaIndex;
  }

  get currentProcessor(): UcProcessorName | undefined {
    return this.#profiler.current.processor;
  }

  get currentSchema(): UcSchema | undefined {
    return this.#profiler.current.schema;
  }

  get currentPresentation(): UcPresentationName | undefined {
    return this.#profiler.current.within;
  }

  get currentConstraint(): UcFeatureConstraint | undefined {
    return this.#profiler.current.constraint;
  }

  enable<TOptions>(
    feature: UccFeature<TSetup, TOptions>,
    options?: TOptions,
    data?: unknown,
  ): this {
    this.#profiler.enableFeature(feature, options!, data);

    return this;
  }

  processModel<T>(model: UcModel<T>, data?: unknown): this {
    const schema = ucSchema(model);

    this.#applyConstraints<T>(schema, undefined, schema.where, data);
    for (const within of this.schemaIndex.listPresentations(schema.within)) {
      this.#applyConstraints(schema, within, schema.within![within], data);
    }

    return this;
  }

  #applyConstraints<T>(
    schema: UcSchema<T>,
    within: UcPresentationName | undefined,
    constraints: UcConstraints<T> | undefined,
    data: unknown,
  ): void {
    for (const processor of this.schemaIndex.processors) {
      for (const constraint of asArray(constraints?.[processor])) {
        this.#useFeature(schema, { processor, within, constraint, data });
      }
    }
  }

  #useFeature(schema: UcSchema, config: UccProcessor$ConstraintConfig): void {
    const {
      constraint: { use: feature, from },
    } = config;
    const useId = `${this.schemaIndex.schemaId(schema)}::${from}::${feature}`;
    let use = this.#uses.get(useId);

    if (!use) {
      this.#hasPendingInstructions = true;
      use = new UccProcessor$FeatureUse(this.#profiler, schema);
      this.#uses.set(useId, use);
    }

    use.addConfig(config);
  }

  protected async processInstructions(): Promise<void> {
    this.#activateCapabilities();
    this.#profiler.init();
    this.#collectInstructions();
    await this.#processInstructions();
    this.#enableExplicitFeatures();
    await this.#processInstructions(); // More instructions may be added by explicit features.
  }

  #activateCapabilities(): void {
    this.#capabilities?.forEach(capability => {
      capability(new UccProcessor$CapabilityActivation(this.#profiler));
    });
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
      for (const use of this.#uses.values()) {
        await use.apply();
      }
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
   * Creates schema processing feature configuration for just {@link enable enabled} `feature`.
   *
   * @param setup - Schema processing setup.
   * @param feature - Enabled feature.
   *
   * @returns Schema processing configuration.
   */
  createConfig<TOptions>(
    setup: TSetup,
    feature: UccFeature<TSetup, TOptions>,
  ): UccConfig<TOptions> {
    return 'uccProcess' in feature ? feature.uccProcess(setup) : feature(setup);
  }

}

export namespace UccProcessor {
  /**
   * Schema {@link UccProcessor processing} options.
   *
   * @typeParam TSetup - Schema processing setup type.
   */
  export interface Options<in TSetup extends UccSetup<TSetup>> {
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
     * Processor capabilities to activate.
     */
    readonly capabilities?: UccCapability<TSetup> | readonly UccCapability<TSetup>[] | undefined;

    /**
     * Models with constraints to extract processing instructions from.
     */
    readonly models?: { readonly [name in string]?: Entry | undefined } | undefined;

    /**
     * Additional schema processing features to enable and use.
     */
    readonly features?: UccFeature<TSetup, void> | readonly UccFeature<TSetup, void>[] | undefined;
  }

  /**
   * Processed model entry.
   */
  export interface Entry {
    /**
     * Model to process.
     */
    readonly model: UcModel;
  }
}
