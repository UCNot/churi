import { UcSchema } from '../../../schema/uc-schema.js';
import { UccFeature } from '../ucc-feature.js';
import { UccSetup } from '../ucc-setup.js';
import { UccProcessor$ConstraintIssue } from './ucc-processor.constraint-issue.js';
import { UccProcessor$Current } from './ucc-processor.current.js';
import { UccProcessor$FeatureConfig } from './ucc-processor.feature-config.js';
import { UccProcessor$Profiler } from './ucc-processor.profiler.js';

export class UccProcessor$Config<in out TSetup extends UccSetup<TSetup>> {

  readonly #profiler: UccProcessor$Profiler<TSetup>;
  readonly #configs = new Map<UccFeature<TSetup, never>, UccProcessor$FeatureConfig<TSetup>>();

  #current: UccProcessor$Current = {};

  constructor(profiler: UccProcessor$Profiler<TSetup>) {
    this.#profiler = profiler;
  }

  get setup(): TSetup {
    return this.#profiler.setup;
  }

  get profiler(): UccProcessor$Profiler<TSetup> {
    return this.#profiler;
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
    feature: UccFeature<TSetup, TOptions>,
    issue: UccProcessor$ConstraintIssue,
  ): void {
    this.#featureConfig(feature).configureSchema(this, schema, issue);
  }

  #featureConfig<TOptions>(
    feature: UccFeature<TSetup, TOptions>,
  ): UccProcessor$FeatureConfig<TSetup, TOptions> {
    let config = this.#configs.get(feature) as
      | UccProcessor$FeatureConfig<TSetup, TOptions>
      | undefined;

    if (!config) {
      const { processor } = this.#profiler;

      config = new UccProcessor$FeatureConfig(() => processor.createConfig(feature));
      this.#configs.set(feature, config);
    }

    return config;
  }

  configure(current: UccProcessor$Current, action: () => void): void {
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

}
