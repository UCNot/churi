import { UcProcessorName, UcSchemaConstraint } from '../../../schema/uc-constraints.js';
import { UcPresentationName } from '../../../schema/uc-presentations.js';
import { UccBootstrap } from '../ucc-bootstrap.js';
import { UccFeature } from '../ucc-feature.js';

export class UccProcessor$ConstraintMapper<in out TBoot extends UccBootstrap<TBoot>> {
  readonly #handlers = new Map<string, UccFeature.ConstraintHandler<TBoot>>();

  onConstraint<TOptions>(
    { processor, within, use, from }: UccFeature.ConstraintCriterion,
    handler: UccFeature.ConstraintHandler<TBoot, TOptions>,
  ): void {
    const handlerId = this.#handlerId(processor, within, use, from);
    const prevHandler = this.#handlers.get(handlerId) as UccFeature.ConstraintHandler<
      TBoot,
      TOptions
    >;

    if (prevHandler) {
      this.#handlers.set(
        handlerId,
        (application: UccFeature.ConstraintApplication<TBoot, TOptions>) => {
          prevHandler(application);
          handler(application);
        },
      );
    } else {
      this.#handlers.set(handlerId, handler);
    }
  }

  findHandler<TOptions>(
    processor: UcProcessorName,
    within: UcPresentationName | undefined,
    { use, from }: UcSchemaConstraint,
  ): UccFeature.ConstraintHandler<TBoot, TOptions> | undefined {
    return this.#handlers.get(
      this.#handlerId(processor, within, use, from),
    ) as UccFeature.ConstraintHandler<TBoot, TOptions>;
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
