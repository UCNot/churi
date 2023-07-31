import { UccCapability } from '../ucc-capability.js';
import { UccFeature } from '../ucc-feature.js';
import { UccSetup } from '../ucc-setup.js';
import { UccProcessor$Profiler } from './ucc-processor.profiler.js';

export class UccProcessor$CapabilityActivation<in out TSetup extends UccSetup<TSetup>>
  implements UccCapability.Activation<TSetup> {

  readonly #profiler: UccProcessor$Profiler<TSetup>;

  constructor(profiler: UccProcessor$Profiler<TSetup>) {
    this.#profiler = profiler;
  }

  enable<TOptions>(feature: UccFeature<TSetup, TOptions>, options?: TOptions): this {
    this.#profiler.enable(feature, options!);

    return this;
  }

  onConstraint(
    criterion: UccCapability.ConstraintCriterion,
    handler: UccCapability.ConstraintHandler<TSetup>,
  ): this {
    this.#profiler.onConstraint(criterion, handler);

    return this;
  }

}
