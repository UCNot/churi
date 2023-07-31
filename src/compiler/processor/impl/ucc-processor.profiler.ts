import { UcFeatureConstraint, UcProcessorName } from '../../../schema/uc-constraints.js';
import { UcPresentationName } from '../../../schema/uc-presentations.js';
import { UccCapability } from '../ucc-capability.js';
import { UccFeature } from '../ucc-feature.js';
import { UccProcessor } from '../ucc-processor.js';
import { UccSetup } from '../ucc-setup.js';

export class UccProcessor$Profiler<in out TSetup extends UccSetup<TSetup>> {

  readonly #processor: UccProcessor<TSetup>;
  readonly #init: ((setup: TSetup) => void)[] = [];
  readonly #handlers = new Map<string, UccCapability.ConstraintHandler<TSetup>>();

  constructor(processor: UccProcessor<TSetup>) {
    this.#processor = processor;
  }

  get setup(): TSetup {
    return this.#processor.setup;
  }

  get processor(): UccProcessor<TSetup> {
    return this.#processor;
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

  findHandler(
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
