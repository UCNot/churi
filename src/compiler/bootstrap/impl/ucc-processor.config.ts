import { UcSchema } from '../../../schema/uc-schema.js';
import { UccBootstrap } from '../ucc-bootstrap.js';
import { UccFeature } from '../ucc-feature.js';
import { UccProcessor$ConstraintIssue } from './ucc-processor.constraint-issue.js';
import { UccProcessor$Current } from './ucc-processor.current.js';
import { UccProcessor$FeatureConfig } from './ucc-processor.feature-config.js';
import { UccProcessor$Profiler } from './ucc-processor.profiler.js';

export class UccProcessor$Config<in out TBoot extends UccBootstrap<TBoot>> {

  readonly #profiler: UccProcessor$Profiler<TBoot>;
  readonly #configs = new Map<UccFeature<TBoot, never>, UccProcessor$FeatureConfig<TBoot>>();

  #current: UccProcessor$Current = {};

  constructor(profiler: UccProcessor$Profiler<TBoot>) {
    this.#profiler = profiler;
  }

  get boot(): TBoot {
    return this.#profiler.boot;
  }

  get profiler(): UccProcessor$Profiler<TBoot> {
    return this.#profiler;
  }

  get current(): UccProcessor$Current {
    return this.#current;
  }

  enableFeature<TOptions>(feature: UccFeature<TBoot, TOptions>, options: TOptions): void {
    this.#featureConfig(feature).configureFeature(this, options);
  }

  enableSchema<TOptions>(
    schema: UcSchema,
    feature: UccFeature<TBoot, TOptions>,
    issue: UccProcessor$ConstraintIssue,
  ): void {
    this.#featureConfig(feature).configureSchema(this, schema, issue);
  }

  #featureConfig<TOptions>(
    feature: UccFeature<TBoot, TOptions>,
  ): UccProcessor$FeatureConfig<TBoot, TOptions> {
    let config = this.#configs.get(feature) as
      | UccProcessor$FeatureConfig<TBoot, TOptions>
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
