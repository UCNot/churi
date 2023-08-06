import { UcFeatureConstraint, UcProcessorName } from '../../../schema/uc-constraints.js';
import { UcPresentationName } from '../../../schema/uc-presentations.js';
import { UccBootstrap } from '../ucc-bootstrap.js';
import { UccCapability } from '../ucc-capability.js';
import { UccFeature } from '../ucc-feature.js';
import { UccProcessor } from '../ucc-processor.js';

export class UccProcessor$Profiler<in out TBoot extends UccBootstrap<TBoot>> {

  readonly #processor: UccProcessor<TBoot>;
  readonly #init: ((boot: TBoot) => void)[] = [];
  readonly #handlers = new Map<string, UccCapability.ConstraintHandler<TBoot>>();

  constructor(processor: UccProcessor<TBoot>) {
    this.#processor = processor;
  }

  get boot(): TBoot {
    return this.#processor.boot;
  }

  get processor(): UccProcessor<TBoot> {
    return this.#processor;
  }

  addFeature<TOptions>(feature: UccFeature<TBoot, TOptions>, options: TOptions): void {
    this.#init.push(boot => boot.enable(feature, options));
  }

  init(): void {
    const { boot: boot } = this;

    for (const init of this.#init) {
      init(boot);
    }
  }

  onConstraint(
    { processor, within, use, from }: UccCapability.ConstraintCriterion,
    handler: UccCapability.ConstraintHandler<TBoot>,
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

  findHandler(
    processor: UcProcessorName,
    within: UcPresentationName | undefined,
    { use, from }: UcFeatureConstraint,
  ): UccCapability.ConstraintHandler<TBoot> | undefined {
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
