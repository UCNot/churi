import { UcProcessorName, UcSchemaConstraint } from '../../../schema/uc-constraints.js';
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
  readonly #issue: UccProcessor$ConstraintIssue<TOptions>;
  readonly #handle: UccFeature.Handle<TOptions>;
  #applied = 0;

  constructor(
    featureSet: UccProcessor$FeatureSet<TBoot>,
    issue: UccProcessor$ConstraintIssue<TOptions>,
    handle: UccFeature.Handle<TOptions>,
  ) {
    this.#featureSet = featureSet;
    this.#issue = issue;
    this.#handle = handle;
  }

  get schema(): UcSchema {
    return this.#issue.schema;
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
    this.#featureSet.runWithCurrent(this.#issue, () => this.#handle.constrain(this));
  }

  ignore(): void {
    if (!this.isApplied()) {
      this.#applied = -1;
    }
  }

}
