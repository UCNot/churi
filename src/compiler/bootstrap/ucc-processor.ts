import { asArray, isPresent, lazyValue } from '@proc7ts/primitives';
import { UcConstraints, UcProcessorName, UcSchemaConstraint } from '../../schema/uc-constraints.js';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UccProcessor$CapabilityActivation } from './impl/ucc-processor.capability-activation.js';
import { UccProcessor$Config } from './impl/ucc-processor.config.js';
import { UccProcessor$ConstraintIssue } from './impl/ucc-processor.constraint-issue.js';
import { UccProcessor$ConstraintUsage } from './impl/ucc-processor.constraint-usage.js';
import { UccProcessor$Profiler } from './impl/ucc-processor.profiler.js';
import { UccBootstrap } from './ucc-bootstrap.js';
import { UccCapability } from './ucc-capability.js';
import { UccFeature } from './ucc-feature.js';
import { UccSchemaIndex } from './ucc-schema-index.js';

/**
 * Abstract schema processor.
 *
 * Supports processing {@link UccFeature features}.
 *
 * @typeParam TBoot - Type of schema processing bootstrap.
 */
export abstract class UccProcessor<in out TBoot extends UccBootstrap<TBoot>>
  implements UccBootstrap<TBoot> {

  readonly #schemaIndex: UccSchemaIndex;
  readonly #capabilities: readonly UccCapability<TBoot>[] | undefined;
  readonly #models: readonly UcModel[] | undefined;
  readonly #features: readonly UccFeature<TBoot, void>[] | undefined;
  readonly #getBoot = lazyValue(() => this.startBootstrap());
  readonly #profiler: UccProcessor$Profiler<TBoot>;
  readonly #config: UccProcessor$Config<TBoot>;
  readonly #usages = new Map<UcSchema['type'], UccProcessor$ConstraintUsage<TBoot>>();

  #hasPendingInstructions = false;

  /**
   * Constructs schema processor.
   *
   * @param options - Schema processing options.
   */
  constructor(options: UccProcessor.Options<TBoot>);
  constructor({
    processors,
    presentations = [],
    capabilities,
    models,
    features,
  }: UccProcessor.Options<TBoot>) {
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
    this.#profiler = new UccProcessor$Profiler<TBoot>(this);
    this.#config = new UccProcessor$Config<TBoot>(this.#profiler, feature => this.handleFeature(feature));
  }

  get boot(): TBoot {
    return this.#getBoot();
  }

  get schemaIndex(): UccSchemaIndex {
    return this.#schemaIndex;
  }

  get currentProcessor(): UcProcessorName | undefined {
    return this.#config.current.processor;
  }

  get currentSchema(): UcSchema | undefined {
    return this.#config.current.schema;
  }

  get currentPresentation(): UcPresentationName | undefined {
    return this.#config.current.within;
  }

  get currentConstraint(): UcSchemaConstraint | undefined {
    return this.#config.current.constraint;
  }

  enable<TOptions>(feature: UccFeature<TBoot, TOptions>): this {
    this.#config.enableFeature(feature);

    return this;
  }

  processModel<T>(model: UcModel<T>): this {
    const schema = ucSchema(model);

    this.#applyConstraints<T>(schema, undefined, schema.where);
    for (const within of this.schemaIndex.listPresentations(schema.within)) {
      this.#applyConstraints(schema, within, schema.within![within]);
    }

    return this;
  }

  #applyConstraints<T>(
    schema: UcSchema<T>,
    within: UcPresentationName | undefined,
    constraints: UcConstraints<T> | undefined,
  ): void {
    for (const processor of this.schemaIndex.processors) {
      for (const constraint of asArray(constraints?.[processor])) {
        this.#issueConstraint(
          schema,
          new UccProcessor$ConstraintIssue(processor, within, constraint),
        );
      }
    }
  }

  #issueConstraint(schema: UcSchema, issue: UccProcessor$ConstraintIssue): void {
    const {
      constraint: { use: feature, from },
    } = issue;
    const usageId = `${this.schemaIndex.schemaId(schema)}::${from}::${feature}`;
    let usage = this.#usages.get(usageId);

    if (!usage) {
      this.#hasPendingInstructions = true;
      usage = new UccProcessor$ConstraintUsage(this.#config, schema);
      this.#usages.set(usageId, usage);
    }

    usage.issue(issue);
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
   * Processes constraints issued by {@link enable features} and {@link processModel modules}.
   */
  async #processInstructions(): Promise<void> {
    while (this.#hasPendingInstructions) {
      this.#hasPendingInstructions = false;
      await this.#applyIssuedConstraints();
    }
  }

  async #applyIssuedConstraints(): Promise<void> {
    for (const usage of this.#usages.values()) {
      await usage.apply();
    }
  }

  #enableExplicitFeatures(): void {
    this.#features?.forEach(feature => {
      this.enable(feature);
    });
  }

  /**
   * Starts schema processing bootstrap.
   *
   * @returns New schema processing bootstrap instance.
   */
  protected abstract startBootstrap(): TBoot;

  /**
   * Handles just {@link enable enabled} schema processing feature `feature`.
   *
   * @param feature - Enabled feature.
   *
   * @returns Either feature handle, or nothing.
   */
  protected handleFeature<TOptions>(
    feature: UccFeature<TBoot, TOptions>,
  ): UccFeature.Handle<TOptions> | void {
    return 'uccEnable' in feature ? feature.uccEnable(this.boot) : feature(this.boot);
  }

}

export namespace UccProcessor {
  /**
   * Schema {@link UccProcessor processing} options.
   *
   * @typeParam TBoot - Type of schema processing bootstrap.
   */
  export interface Options<in TBoot extends UccBootstrap<TBoot>> {
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
    readonly capabilities?: UccCapability<TBoot> | readonly UccCapability<TBoot>[] | undefined;

    /**
     * Models with constraints to extract processing instructions from.
     */
    readonly models?: { readonly [name in string]?: Entry | undefined } | undefined;

    /**
     * Additional schema processing features to enable and use.
     */
    readonly features?: UccFeature<TBoot, void> | readonly UccFeature<TBoot, void>[] | undefined;
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
