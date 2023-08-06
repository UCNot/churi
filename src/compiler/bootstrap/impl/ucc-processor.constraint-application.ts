import { UcProcessorName, UcSchemaConstraint } from '../../../schema/uc-constraints.js';
import { ucModelName } from '../../../schema/uc-model-name.js';
import { UcPresentationName } from '../../../schema/uc-presentations.js';
import { UcSchema } from '../../../schema/uc-schema.js';
import { UccBootstrap } from '../ucc-bootstrap.js';
import { UccFeature } from '../ucc-feature.js';
import { UccProcessor$ConstraintIssue } from './ucc-processor.constraint-issue.js';
import { UccProcessor$FeatureSet } from './ucc-processor.feature-set.js';

export class UccProcessor$ConstraintApplication<
  in out TBoot extends UccBootstrap<TBoot>,
  in out TOptions,
> implements UccFeature.ConstraintApplication<TBoot, TOptions> {

  readonly #featureSet: UccProcessor$FeatureSet<TBoot>;
  readonly #schema: UcSchema;
  readonly #issue: UccProcessor$ConstraintIssue<TOptions>;
  readonly #feature: UccFeature<TBoot, TOptions>;
  #applied = 0;

  constructor(
    featureSet: UccProcessor$FeatureSet<TBoot>,
    schema: UcSchema,
    issue: UccProcessor$ConstraintIssue<TOptions>,
    feature: UccFeature<TBoot, TOptions>,
  ) {
    this.#featureSet = featureSet;
    this.#schema = schema;
    this.#issue = issue;
    this.#feature = feature;
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

  get options(): TOptions {
    return this.#issue.options;
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

  #constrain(): void {
    const handle = this.#featureSet.enableFeature(this.#feature);
    const { options } = this;

    if (handle) {
      this.#featureSet.runWithCurrent(this, () => handle.constrain(this));
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
