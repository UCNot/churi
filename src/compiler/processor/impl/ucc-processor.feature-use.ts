import { UcSchema } from '../../../schema/uc-schema.js';
import { UccSetup } from '../ucc-setup.js';
import { UccProcessor$ConstraintConfig } from './ucc-processor.constraint-config.js';
import { UccProcessor$Profiler } from './ucc-processor.profiler.js';

export class UccProcessor$FeatureUse<in out TSetup extends UccSetup<TSetup>> {

  readonly #schema: UcSchema;
  readonly #configs: UccProcessor$ConstraintConfig[] = [];

  #applied = false;
  #profiler: UccProcessor$Profiler<TSetup>;

  constructor(profiler: UccProcessor$Profiler<TSetup>, schema: UcSchema) {
    this.#profiler = profiler;
    this.#schema = schema;
  }

  addConfig(config: UccProcessor$ConstraintConfig): void {
    this.#configs.push(config);
  }

  async apply(): Promise<void> {
    if (this.#applied) {
      return;
    }

    this.#applied = true;

    for (const config of this.#configs) {
      await this.#profiler.applyConstraint(this.#schema, config);
    }
  }

}
