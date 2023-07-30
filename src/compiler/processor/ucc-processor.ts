import { asArray, lazyValue, mayHaveProperties } from '@proc7ts/primitives';
import { esQuoteKey, esStringLiteral } from 'esgen';
import {
  UcConstraints,
  UcFeatureConstraint,
  UcProcessorName,
} from '../../schema/uc-constraints.js';
import { UcPresentationName } from '../../schema/uc-presentations.js';
import { UcModel, UcSchema, ucSchema } from '../../schema/uc-schema.js';
import { UccConfig } from './ucc-config.js';
import { UccFeature } from './ucc-feature.js';
import { UccProfile } from './ucc-profile.js';
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
  readonly #profiles: readonly UccProfile<TSetup>[] | undefined;
  readonly #models: readonly UcModel[] | undefined;
  readonly #features: readonly UccFeature<TSetup, void>[] | undefined;
  readonly #getSetup = lazyValue(() => this.createSetup());
  readonly #profiler = new UccProcessor$Profiler<TSetup>(this, this.#configureAsync.bind(this));

  readonly #configs = new Map<UccFeature<TSetup, never>, () => UccConfig<never>>();
  readonly #uses = new Map<UcSchema['type'], UccProcessor$FeatureUse<TSetup>>();

  #hasPendingInstructions = false;
  #current: UccProcessor$Current = {};

  /**
   * Constructs schema processor.
   *
   * @param init - Processor initialization options.
   */
  constructor(init: UccProcessorInit<TSetup>);
  constructor({
    processors,
    presentations = [],
    profiles,
    models,
    features,
  }: UccProcessorInit<TSetup>) {
    this.#schemaIndex = new UccSchemaIndex(
      asArray<UcProcessorName>(processors),
      asArray<UcPresentationName>(presentations),
    );
    this.#profiles = profiles && asArray(profiles);
    this.#models = models;
    this.#features = features && asArray(features);
  }

  get setup(): TSetup {
    return this.#getSetup();
  }

  get schemaIndex(): UccSchemaIndex {
    return this.#schemaIndex;
  }

  get currentProcessor(): UcProcessorName | undefined {
    return this.#current.processor;
  }

  get currentSchema(): UcSchema | undefined {
    return this.#current.schema;
  }

  get currentPresentation(): UcPresentationName | undefined {
    return this.#current.within;
  }

  get currentConstraint(): UcFeatureConstraint | undefined {
    return this.#current.constraint;
  }

  enable<TOptions>(feature: UccFeature<TSetup, TOptions>, options?: TOptions): this {
    let getConfig = this.#configs.get(feature) as (() => UccConfig<TOptions>) | undefined;

    if (!getConfig) {
      getConfig = lazyValue(() => this.createConfig(this.setup, feature));
      this.#configs.set(feature, getConfig);
    }

    this.#configureSync({}, () => getConfig!().configure(options!));

    return this;
  }

  #configureSync(current: UccProcessor$Current, action: () => void): void {
    const prev = this.#pushCurrent(current);

    try {
      action();
    } finally {
      this.#current = prev;
    }
  }

  async #configureAsync(current: UccProcessor$Current, action: () => Promise<void>): Promise<void> {
    const prev = this.#pushCurrent(current);

    try {
      await action();
    } finally {
      this.#current = prev;
    }
  }

  #pushCurrent(current: UccProcessor$Current): UccProcessor$Current {
    const prev = this.#current;

    this.#current = current.processor ? current : { ...current, processor: prev.processor };

    return prev;
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
      for (const feature of asArray(constraints?.[processor])) {
        this.#useFeature(processor, schema, within, feature);
      }
    }
  }

  #useFeature(
    processor: UcProcessorName,
    schema: UcSchema,
    within: UcPresentationName | undefined,
    constraint: UcFeatureConstraint,
  ): void {
    const { use: feature, from } = constraint;
    const useId = `${this.schemaIndex.schemaId(schema)}::${from}::${feature}`;
    let use = this.#uses.get(useId);

    if (!use) {
      this.#hasPendingInstructions = true;
      use = new UccProcessor$FeatureUse(this.#profiler, schema);
      this.#uses.set(useId, use);
    }

    use.addConfig(processor, within, constraint);
  }

  protected async processInstructions(): Promise<void> {
    this.#applyProfiles();
    this.#collectInstructions();
    await this.#processInstructions();
    this.#enableExplicitFeatures();
    await this.#processInstructions(); // More instructions may be added by explicit features.
  }

  #applyProfiles(): void {
    this.#profiles?.forEach(profile => {
      profile(new UccProcessor$ProfileActivation(this.#profiler));
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

}

/**
 * Schema {@link UccProcessor processor} initialization options.
 *
 * @typeParam TSetup - Schema processing setup type.
 */
export interface UccProcessorInit<in TSetup extends UccSetup<TSetup>> {
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
   * Processor profiles to enable.
   */
  readonly profiles?: UccProfile<TSetup> | readonly UccProfile<TSetup>[] | undefined;

  /**
   * Models with constraints to extract processing instructions from.
   */
  readonly models?: readonly UcModel[] | undefined;

  /**
   * Additional schema processing features to enable and use.
   */
  readonly features?: UccFeature<TSetup, void> | readonly UccFeature<TSetup, void>[] | undefined;
}

interface UccProcessor$Current {
  readonly processor?: UcProcessorName | undefined;
  readonly schema?: UcSchema | undefined;
  readonly within?: UcPresentationName | undefined;
  readonly constraint?: UcFeatureConstraint | undefined;
}

class UccProcessor$Profiler<in out TSetup extends UccSetup<TSetup>> {

  readonly #processor: UccProcessor<TSetup>;
  readonly #configure: (
    current: UccProcessor$Current,
    action: () => Promise<void>,
  ) => Promise<void>;

  readonly #handlers = new Map<string, UccProfile.ConstraintHandler<TSetup>>();

  constructor(
    processor: UccProcessor<TSetup>,
    configure: (current: UccProcessor$Current, action: () => Promise<void>) => Promise<void>,
  ) {
    this.#processor = processor;
    this.#configure = configure;
  }

  get setup(): TSetup {
    return this.#processor.setup;
  }

  onConstraint(
    { processor, within, use, from }: UccProfile.ConstraintCriterion,
    handler: UccProfile.ConstraintHandler<TSetup>,
  ): void {
    const handlerId = this.#handlerId(processor, within, use, from);
    const prevHandler = this.#handlers.get(handlerId);

    if (prevHandler) {
      this.#handlers.set(handlerId, async application => {
        await prevHandler(application);
        await handler(application);
      });
    } else {
      this.#handlers.set(handlerId, handler);
    }
  }

  async applyConstraint(
    processor: UcProcessorName,
    schema: UcSchema,
    within: UcPresentationName | undefined,
    constraint: UcFeatureConstraint,
  ): Promise<void> {
    const application = new UccProcessor$ConstraintApplication(
      this,
      processor,
      schema,
      within,
      constraint,
    );

    await this.#configure({ processor, schema, within, constraint }, async () => {
      await this.#findHandler(processor, within, constraint)?.(application);
      if (within) {
        // Apply any presentation handler.
        await this.#findHandler(processor, undefined, constraint)?.(application);
      }
      if (!application.isIgnored()) {
        await application.apply();
      }
    });
  }

  #findHandler(
    processor: UcProcessorName,
    within: UcPresentationName | undefined,
    { use, from }: UcFeatureConstraint,
  ): UccProfile.ConstraintHandler<TSetup> | undefined {
    return this.#handlers.get(this.#handlerId(processor, within, use, from)); // Match concrete presentations.;
  }

  #handlerId(
    processor: UcProcessorName,
    within: UcPresentationName | undefined,
    use: string,
    from: string,
  ): string {
    return `${processor}(${within} ?? '*'):${use}@${from}`;
  }

}

class UccProcessor$ConstraintApplication<in out TSetup extends UccSetup<TSetup>>
  implements UccProfile.ConstraintApplication<TSetup> {

  readonly #profiler: UccProcessor$Profiler<TSetup>;
  readonly #processor: UcProcessorName;
  readonly #schema: UcSchema;
  readonly #within: UcPresentationName | undefined;
  readonly #constraint: UcFeatureConstraint;
  #applied = 0;

  constructor(
    profiler: UccProcessor$Profiler<TSetup>,
    processor: UcProcessorName,
    schema: UcSchema,
    within: UcPresentationName | undefined,
    constraint: UcFeatureConstraint,
  ) {
    this.#profiler = profiler;
    this.#processor = processor;
    this.#schema = schema;
    this.#within = within;
    this.#constraint = constraint;
  }

  get setup(): TSetup {
    return this.#profiler.setup;
  }

  get schema(): UcSchema {
    return this.#schema;
  }

  get processor(): UcProcessorName {
    return this.#processor;
  }

  get within(): UcPresentationName | undefined {
    return this.#within;
  }

  get constraint(): UcFeatureConstraint {
    return this.#constraint;
  }

  isApplied(): boolean {
    return this.#applied > 0;
  }

  isIgnored(): boolean {
    return this.#applied < 0;
  }

  async apply(): Promise<void> {
    if (this.isApplied()) {
      return;
    }

    this.#applied = 1;

    const { use, from, with: options } = this.constraint;

    const {
      [use]: constraint,
    }: { [name: string]: UccFeature<TSetup, unknown> | UccSchemaFeature<TSetup, unknown> } =
      await import(from);

    if (mayHaveProperties(constraint)) {
      let configured = false;

      if ('uccProcess' in constraint) {
        this.setup.enable(constraint, options);
        configured = true;
      }
      if ('uccProcessSchema' in constraint) {
        constraint.uccProcessSchema(this.setup, this.schema).configure(options);
        configured = true;
      }

      if (configured) {
        return;
      }

      if (typeof constraint === 'function') {
        constraint(this.setup, this.schema).configure(options);

        return;
      }
    }

    if (constraint === undefined) {
      throw new ReferenceError(`No such schema processing feature: ${this}`);
    }

    throw new ReferenceError(`Not a schema processing feature: ${this}`);
  }

  ignore(): void {
    if (!this.isApplied()) {
      this.#applied = -1;
    }
  }

  toString(): string {
    const { use, from } = this.#constraint;

    return `import(${esStringLiteral(from)}).${esQuoteKey(use)}`;
  }

}

class UccProcessor$ProfileActivation<in out TSetup extends UccSetup<TSetup>>
  implements UccProfile.Activation<TSetup> {

  readonly #profiler: UccProcessor$Profiler<TSetup>;

  constructor(profiler: UccProcessor$Profiler<TSetup>) {
    this.#profiler = profiler;
  }

  onConstraint(
    criterion: UccProfile.ConstraintCriterion,
    handler: UccProfile.ConstraintHandler<TSetup>,
  ): this {
    this.#profiler.onConstraint(criterion, handler);

    return this;
  }

}

class UccProcessor$FeatureUse<in out TSetup extends UccSetup<TSetup>> {

  readonly #schema: UcSchema;
  readonly #constraints: [UcProcessorName, UcPresentationName | undefined, UcFeatureConstraint][] =
    [];

  #applied = false;
  #profiler: UccProcessor$Profiler<TSetup>;

  constructor(profiler: UccProcessor$Profiler<TSetup>, schema: UcSchema) {
    this.#profiler = profiler;
    this.#schema = schema;
  }

  addConfig(
    processor: UcProcessorName,
    presentation: UcPresentationName | undefined,
    constraint: UcFeatureConstraint,
  ): void {
    this.#constraints.push([processor, presentation, constraint]);
  }

  async apply(): Promise<void> {
    if (this.#applied) {
      return;
    }

    this.#applied = true;

    for (const [processor, within, constraint] of this.#constraints) {
      await this.#profiler.applyConstraint(processor, this.#schema, within, constraint);
    }
  }

}
