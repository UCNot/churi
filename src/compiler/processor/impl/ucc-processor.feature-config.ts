import { lazyValue } from '@proc7ts/primitives';
import { UcSchema } from '../../../schema/uc-schema.js';
import { UccConfig } from '../ucc-config.js';
import { UccSetup } from '../ucc-setup.js';
import { UccProcessor$ConstraintConfig } from './ucc-processor.constraint-config.js';
import { UccProcessor$Current } from './ucc-processor.current.js';
import { UccProcessor$Profiler } from './ucc-processor.profiler.js';

export class UccProcessor$FeatureConfig<TSetup extends UccSetup<TSetup>, in TOptions = never> {

  readonly #getConfig: () => UccConfig<TOptions>;
  #featureConfigured = false;

  constructor(getConfig: () => UccConfig<TOptions>) {
    this.#getConfig = lazyValue(getConfig);
  }

  configureFeature(
    profiler: UccProcessor$Profiler<TSetup>,
    options: TOptions,
    data: unknown,
  ): void {
    this.#configureFeature(profiler, {}, options, data);
  }

  configureSchema(
    profiler: UccProcessor$Profiler<TSetup>,
    schema: UcSchema,
    constraint: UccProcessor$ConstraintConfig,
    options: TOptions,
    data: unknown,
  ): void {
    if (!this.#featureConfigured) {
      this.#configureFeature(profiler, { processor: constraint.processor }, undefined!, undefined);
    }

    profiler.configureSync({ ...constraint, schema }, () => {
      this.#getConfig().configureSchema?.(schema, options, data);
    });
  }

  #configureFeature(
    profiler: UccProcessor$Profiler<TSetup>,
    current: UccProcessor$Current,
    options: TOptions,
    data: unknown,
  ): void {
    this.#featureConfigured = true;
    profiler.configureSync(current, () => this.#getConfig().configure?.(options, data));
  }

}
