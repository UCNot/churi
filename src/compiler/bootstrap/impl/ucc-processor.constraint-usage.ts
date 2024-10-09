import { isPresent } from '@proc7ts/primitives';
import { UcSchema } from '../../../schema/uc-schema.js';
import { UccBootstrap } from '../ucc-bootstrap.js';
import { UccProcessor$ConstraintApplication } from './ucc-processor.constraint-application.js';
import {
  UccProcessor$ConstraintIssue,
  UccProcessor$ConstraintResolution,
} from './ucc-processor.constraint-issue.js';
import { UccProcessor$FeatureSet } from './ucc-processor.feature-set.js';

export class UccProcessor$ConstraintUsage<
  in out TBoot extends UccBootstrap<TBoot>,
  in out TOptions = unknown,
> {
  readonly #featureSet: UccProcessor$FeatureSet<TBoot>;
  readonly #schema: UcSchema;
  readonly #issues: UccProcessor$ConstraintIssue<TOptions>[] = [];
  #inspected = false;

  constructor(featureSet: UccProcessor$FeatureSet<TBoot>, schema: UcSchema) {
    this.#featureSet = featureSet;
    this.#schema = schema;
  }

  issue(issue: UccProcessor$ConstraintIssue<TOptions>): void {
    this.#issues.push(issue);
  }

  async resolve(): Promise<() => void> {
    const featureSet = this.#featureSet;
    const resolutions = (
      await Promise.all(this.#issues.map(async issue => await featureSet.resolveConstraint(issue)))
    ).filter(isPresent);

    this.#issues.length = 0;

    return () => {
      this.#inspect(resolutions[0]);

      for (const resolution of resolutions) {
        this.#applyConstraint(resolution);
      }
    };
  }

  #inspect(resolution: UccProcessor$ConstraintResolution<TBoot, TOptions> | undefined): void {
    if (!this.#inspected && resolution) {
      this.#inspected = true;
      resolution.handle.inspect?.(this.#schema);
    }
  }

  #applyConstraint({ issue, handle }: UccProcessor$ConstraintResolution<TBoot, TOptions>): void {
    const featureSet = this.#featureSet;
    const { processor, within, constraint } = issue;
    const { constraintMapper } = featureSet;
    const application = new UccProcessor$ConstraintApplication(featureSet, issue, handle);

    featureSet.runWithCurrent(issue, () => {
      constraintMapper.findHandler(processor, within, constraint)?.(application);
      if (within) {
        // Apply any presentation handler.
        constraintMapper.findHandler(processor, undefined, constraint)?.(application);
      }
      if (!application.isIgnored()) {
        application.apply();
      }
    });
  }
}
