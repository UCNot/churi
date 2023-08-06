import { UcProcessorName, UcSchemaConstraint } from '../../../schema/uc-constraints.js';
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

  addFeature<TOptions>(feature: UccFeature<TBoot, TOptions>): void {
    this.#init.push(boot => boot.enable(feature));
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
      this.#handlers.set(handlerId, application => {
        prevHandler(application);
        handler(application);
      });
    } else {
      this.#handlers.set(handlerId, handler);
    }
  }

  findHandler(
    processor: UcProcessorName,
    within: UcPresentationName | undefined,
    { use, from }: UcSchemaConstraint,
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
