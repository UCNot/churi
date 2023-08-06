import { UccBootstrap } from '../ucc-bootstrap.js';
import { UccCapability } from '../ucc-capability.js';
import { UccFeature } from '../ucc-feature.js';
import { UccProcessor$Profiler } from './ucc-processor.profiler.js';

export class UccProcessor$CapabilityActivation<in out TBoot extends UccBootstrap<TBoot>>
  implements UccCapability.Activation<TBoot> {

  readonly #profiler: UccProcessor$Profiler<TBoot>;

  constructor(profiler: UccProcessor$Profiler<TBoot>) {
    this.#profiler = profiler;
  }

  enable<TOptions>(feature: UccFeature<TBoot, TOptions>): this {
    this.#profiler.addFeature(feature);

    return this;
  }

  onConstraint(
    criterion: UccCapability.ConstraintCriterion,
    handler: UccCapability.ConstraintHandler<TBoot>,
  ): this {
    this.#profiler.onConstraint(criterion, handler);

    return this;
  }

}
