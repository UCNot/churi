import { UcSchema } from '../../../schema/uc-schema.js';
import { UccBootstrap } from '../ucc-bootstrap.js';
import { UccProcessor$ConstraintApplication } from './ucc-processor.constraint-application.js';
import { UccProcessor$ConstraintIssue } from './ucc-processor.constraint-issue.js';
import { UccProcessor$FeatureSet } from './ucc-processor.feature-set.js';

export class UccProcessor$ConstraintUsage<
  in out TBoot extends UccBootstrap<TBoot>,
  out TOptions = unknown,
> {

  readonly #featureSet: UccProcessor$FeatureSet<TBoot>;
  readonly #schema: UcSchema;
  readonly #issues: UccProcessor$ConstraintIssue<TOptions>[] = [];

  constructor(featureSet: UccProcessor$FeatureSet<TBoot>, schema: UcSchema) {
    this.#featureSet = featureSet;
    this.#schema = schema;
  }

  issue(issue: UccProcessor$ConstraintIssue<TOptions>): void {
    this.#issues.push(issue);
  }

  async apply(): Promise<void> {
    for (const issue of this.#issues) {
      await this.#applyConstraint(issue);
    }
    this.#issues.length = 0;
  }

  async #applyConstraint(issue: UccProcessor$ConstraintIssue<TOptions>): Promise<void> {
    const featureSet = this.#featureSet;
    const schema = this.#schema;
    const { processor, within, constraint } = issue;
    const { constraintMapper: profiler } = featureSet;
    const application = new UccProcessor$ConstraintApplication(
      featureSet,
      schema,
      issue,
      await featureSet.resolveFeature(issue),
    );

    featureSet.runWithCurrent({ processor, schema, within, constraint }, () => {
      profiler.findHandler(processor, within, constraint)?.(application);
      if (within) {
        // Apply any presentation handler.
        profiler.findHandler(processor, undefined, constraint)?.(application);
      }
      if (!application.isIgnored()) {
        application.apply();
      }
    });
  }

}
