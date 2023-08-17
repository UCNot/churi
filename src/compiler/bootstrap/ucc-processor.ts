import { asArray, isPresent, lazyValue } from '@proc7ts/primitives';
import { UcConstraints, UcProcessorName, UcSchemaConstraint } from '../../schema/uc-constraints.js';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UccProcessor$ConstraintIssue } from './impl/ucc-processor.constraint-issue.js';
import { UccProcessor$ConstraintMapper } from './impl/ucc-processor.constraint-mapper.js';
import { UccProcessor$ConstraintUsage } from './impl/ucc-processor.constraint-usage.js';
import { UccProcessor$FeatureSet } from './impl/ucc-processor.feature-set.js';
import { UccBootstrap } from './ucc-bootstrap.js';
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
  readonly #models: readonly [string, UcModel][] | undefined;
  readonly #features: readonly UccFeature<TBoot, void>[] | undefined;
  readonly #getBoot = lazyValue(() => this.startBootstrap());
  readonly #constraintMapper: UccProcessor$ConstraintMapper<TBoot>;
  readonly #featureSet: UccProcessor$FeatureSet<TBoot>;
  readonly #usages = new Map<UcSchema['type'], UccProcessor$ConstraintUsage<TBoot>>();
  #pendingInstructions: (() => void | Promise<void>)[] = [];

  /**
   * Constructs schema processor.
   *
   * @param options - Schema processing options.
   */
  constructor(options: UccProcessor.Options<TBoot>);
  constructor({ processors, presentations = [], models, features }: UccProcessor.Options<TBoot>) {
    this.#schemaIndex = new UccSchemaIndex(
      asArray<UcProcessorName>(processors),
      asArray<UcPresentationName>(presentations),
    );
    this.#models =
      models
      && Object.entries<UccProcessor.Entry | undefined>(models)
        .map(
          ([entryName, entry]): [string, UcModel] | undefined => entry && [entryName, entry.model],
        )
        .filter(isPresent);

    this.#features = features && asArray(features);
    this.#constraintMapper = new UccProcessor$ConstraintMapper<TBoot>();
    this.#featureSet = new UccProcessor$FeatureSet(this.#constraintMapper, feature => this.handleFeature(feature));
    this.#updateConstraints();
  }

  get boot(): TBoot {
    return this.#getBoot();
  }

  get schemaIndex(): UccSchemaIndex {
    return this.#schemaIndex;
  }

  get currentProcessor(): UcProcessorName | undefined {
    return this.#featureSet.current.processor;
  }

  get currentEntry(): string | undefined {
    return this.#featureSet.current.entry;
  }

  get currentSchema(): UcSchema | undefined {
    return this.#featureSet.current.schema;
  }

  get currentPresentation(): UcPresentationName | undefined {
    return this.#featureSet.current.within;
  }

  get currentConstraint(): UcSchemaConstraint | undefined {
    return this.#featureSet.current.constraint;
  }

  enable<TOptions>(feature: UccFeature<TBoot, TOptions>): this {
    this.#featureSet.enableFeature(feature);

    return this;
  }

  processModel<T>(model: UcModel<T>): this {
    this.#processModel(model);

    return this;
  }

  #processModel<T>(model: UcModel<T>, entry?: string): void {
    const schema = ucSchema(model);

    this.#issueConstraints<T>(entry, schema, undefined, schema.where);
    for (const within of this.schemaIndex.listPresentations(schema.within)) {
      this.#issueConstraints(entry, schema, within, schema.within![within]);
    }
  }

  #issueConstraints<T>(
    entry: string | undefined,
    schema: UcSchema<T>,
    within: UcPresentationName | undefined,
    constraints: UcConstraints<T> | undefined,
  ): void {
    for (const processor of this.schemaIndex.processors) {
      for (const constraint of asArray(constraints?.[processor])) {
        this.#issueConstraint(
          new UccProcessor$ConstraintIssue(processor, entry, schema, within, constraint),
        );
      }
    }
  }

  #issueConstraint<TOptions>(issue: UccProcessor$ConstraintIssue<TOptions>): void {
    const {
      schema,
      constraint: { use: feature, from },
    } = issue;
    const usageId = `${this.schemaIndex.schemaId(schema)}::${from}::${feature}`;
    let usage = this.#usages.get(usageId);

    if (!usage) {
      this.#updateConstraints();
      usage = new UccProcessor$ConstraintUsage(this.#featureSet, schema);
      this.#usages.set(usageId, usage);
    }

    usage.issue(issue);
  }

  #updateConstraints(): void {
    this.#pendingInstructions.push(() => this.#applyConstraints());
  }

  async #applyConstraints(): Promise<void> {
    const actions = await Promise.all(
      [...this.#usages.values()].map(async usage => await usage.resolve()),
    );

    for (const action of actions) {
      action();
    }
  }

  onConstraint<TOptions>(
    criterion: UccFeature.ConstraintCriterion,
    handler: UccFeature.ConstraintHandler<TBoot, TOptions>,
  ): this {
    this.#constraintMapper.onConstraint(criterion, handler);

    return this;
  }

  protected async processInstructions(): Promise<void> {
    this.#processAllModels();
    this.#enableExplicitFeatures();
    await this.#processInstructions();
  }

  #processAllModels(): void {
    const instructions = this.#pendingInstructions;

    this.#pendingInstructions = [];
    this.#models?.forEach(([entry, model]) => {
      this.#processModel(model, entry);
    });
    this.#pendingInstructions.push(...instructions);
  }

  #enableExplicitFeatures(): void {
    this.#features?.forEach(feature => {
      this.enable(feature);
    });
  }

  /**
   * Processes constraints issued by {@link enable features} and {@link processModel modules}.
   */
  async #processInstructions(): Promise<void> {
    while (this.#pendingInstructions.length) {
      const instructions = this.#pendingInstructions;

      this.#pendingInstructions = [];

      for (const instruction of instructions) {
        await instruction();
      }
    }
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
  ): UccFeature.Handle<TOptions> | undefined;

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
