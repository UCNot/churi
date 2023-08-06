import { UcProcessorName, UcSchemaConstraint } from '../../../schema/uc-constraints.js';
import { ucModelName } from '../../../schema/uc-model-name.js';
import { UcPresentationName } from '../../../schema/uc-presentations.js';
import { UcSchema } from '../../../schema/uc-schema.js';
import { UccBootstrap } from '../ucc-bootstrap.js';
import { UccCapability } from '../ucc-capability.js';
import { UccFeature } from '../ucc-feature.js';
import { UccProcessor$Config } from './ucc-processor.config.js';
import { UccProcessor$ConstraintIssue } from './ucc-processor.constraint-issue.js';

export class UccProcessor$ConstraintApplication<in out TBoot extends UccBootstrap<TBoot>>
  implements UccCapability.ConstraintApplication<TBoot> {

  readonly #config: UccProcessor$Config<TBoot>;
  readonly #schema: UcSchema;
  readonly #issue: UccProcessor$ConstraintIssue;
  readonly #feature: UccFeature<TBoot>;
  #applied = 0;

  constructor(
    config: UccProcessor$Config<TBoot>,
    schema: UcSchema,
    issue: UccProcessor$ConstraintIssue,
    feature: UccFeature<TBoot>,
  ) {
    this.#config = config;
    this.#schema = schema;
    this.#issue = issue;
    this.#feature = feature;
  }

  get boot(): TBoot {
    return this.#config.boot;
  }

  get schema(): UcSchema {
    return this.#schema;
  }

  get processor(): UcProcessorName {
    return this.#issue.processor;
  }

  get within(): UcPresentationName | undefined {
    return this.#issue.within;
  }

  get constraint(): UcSchemaConstraint {
    return this.#issue.constraint;
  }

  isApplied(): boolean {
    return this.#applied > 0;
  }

  isIgnored(): boolean {
    return this.#applied < 0;
  }

  apply(): void {
    if (this.isApplied()) {
      return;
    }

    this.#applied = 1;
    this.#constrain();
  }

  #constrain<TOptions>(): void {
    const handle = this.#config.enableFeature(this.#feature as UccFeature<TBoot, TOptions>);
    const { processor, within, constraint } = this.#issue;
    const options = constraint.with as TOptions;

    if (handle) {
      this.#config.runWithCurrent(
        {
          processor,
          schema: this.schema,
          within,
          constraint,
        },
        () => handle.constrain({
            processor,
            schema: this.schema,
            within,
            constraint,
            options,
          }),
      );
    } else if (options !== undefined) {
      throw new TypeError(
        `Feature ${this.#issue} can not constrain schema "${ucModelName(this.schema)}"`,
      );
    }
  }

  ignore(): void {
    if (!this.isApplied()) {
      this.#applied = -1;
    }
  }

}
