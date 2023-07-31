import { UcFeatureConstraint, UcProcessorName } from '../../../schema/uc-constraints.js';
import { UcPresentationName } from '../../../schema/uc-presentations.js';
import { UcSchema } from '../../../schema/uc-schema.js';
import { UccSetup } from '../ucc-setup.js';
import { UccProcessor$Profiler } from './ucc-processor.profiler.js';

export class UccProcessor$FeatureUse<in out TSetup extends UccSetup<TSetup>> {

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
