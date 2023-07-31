import { UcFeatureConstraint, UcProcessorName } from '../../../schema/uc-constraints.js';
import { UcPresentationName } from '../../../schema/uc-presentations.js';
import { UcSchema } from '../../../schema/uc-schema.js';
import { UccCapability } from '../ucc-capability.js';
import { UccFeature } from '../ucc-feature.js';
import { UccProcessor } from '../ucc-processor.js';
import { UccSetup } from '../ucc-setup.js';
import { UccProcessor$ConstraintApplication } from './ucc-processor.constraint-application.js';
import { UccProcessor$ConstraintConfig } from './ucc-processor.constraint-config.js';
import { UccProcessor$Current } from './ucc-processor.current.js';
import { UccProcessor$FeatureConfig } from './ucc-processor.feature-config.js';

export class UccProcessor$Profiler<in out TSetup extends UccSetup<TSetup>> {

  readonly #processor: UccProcessor<TSetup>;
  readonly #init: ((setup: TSetup) => void)[] = [];
  readonly #configs = new Map<UccFeature<TSetup, never>, UccProcessor$FeatureConfig<TSetup>>();
  readonly #handlers = new Map<string, UccCapability.ConstraintHandler<TSetup>>();

  #current: UccProcessor$Current = {};

  constructor(processor: UccProcessor<TSetup>) {
    this.#processor = processor;
  }

  get setup(): TSetup {
    return this.#processor.setup;
  }

  get current(): UccProcessor$Current {
    return this.#current;
  }

  enableFeature<TOptions>(
    feature: UccFeature<TSetup, TOptions>,
    options: TOptions,
    data: unknown,
  ): void {
    this.#featureConfig(feature).configureFeature(this, options, data);
  }

  enableSchema<TOptions>(
    schema: UcSchema,
    constraint: UccProcessor$ConstraintConfig,
    feature: UccFeature<TSetup, TOptions>,
    options: TOptions,
    data: unknown,
  ): void {
    this.#featureConfig(feature).configureSchema(this, schema, constraint, options, data);
  }

  #featureConfig<TOptions>(
    feature: UccFeature<TSetup, TOptions>,
  ): UccProcessor$FeatureConfig<TSetup, TOptions> {
    let config = this.#configs.get(feature) as
      | UccProcessor$FeatureConfig<TSetup, TOptions>
      | undefined;

    if (!config) {
      config = new UccProcessor$FeatureConfig(() => this.#processor.createConfig(this.setup, feature));
      this.#configs.set(feature, config);
    }

    return config;
  }

  configureSync(current: UccProcessor$Current, action: () => void): void {
    const prev = this.#pushCurrent(current);

    try {
      action();
    } finally {
      this.#current = prev;
    }
  }

  async configureAsync(current: UccProcessor$Current, action: () => Promise<void>): Promise<void> {
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

  addFeature<TOptions>(feature: UccFeature<TSetup, TOptions>, options: TOptions): void {
    this.#init.push(setup => setup.enable(feature, options));
  }

  init(): void {
    const { setup } = this;

    for (const init of this.#init) {
      init(setup);
    }
  }

  onConstraint(
    { processor, within, use, from }: UccCapability.ConstraintCriterion,
    handler: UccCapability.ConstraintHandler<TSetup>,
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

  async applyConstraint(schema: UcSchema, config: UccProcessor$ConstraintConfig): Promise<void> {
    const application = new UccProcessor$ConstraintApplication(this, schema, config);
    const { processor, within, constraint } = config;

    await this.configureAsync({ processor, schema, within, constraint }, async () => {
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
  ): UccCapability.ConstraintHandler<TSetup> | undefined {
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
