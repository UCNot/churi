import { UcSchema } from '../../../schema/uc-schema.js';
import { UccBootstrap } from '../ucc-bootstrap.js';
import { UccProcessor$Config } from './ucc-processor.config.js';
import { UccProcessor$ConstraintApplication } from './ucc-processor.constraint-application.js';
import { UccProcessor$ConstraintIssue } from './ucc-processor.constraint-issue.js';

export class UccProcessor$ConstraintUsage<in out TBoot extends UccBootstrap<TBoot>> {

  readonly #config: UccProcessor$Config<TBoot>;
  readonly #schema: UcSchema;
  readonly #issues: UccProcessor$ConstraintIssue[] = [];

  constructor(config: UccProcessor$Config<TBoot>, schema: UcSchema) {
    this.#config = config;
    this.#schema = schema;
  }

  issue(issue: UccProcessor$ConstraintIssue): void {
    this.#issues.push(issue);
  }

  async apply(): Promise<void> {
    for (const issue of this.#issues) {
      await this.#applyConstraint(issue);
    }
    this.#issues.length = 0;
  }

  async #applyConstraint(issue: UccProcessor$ConstraintIssue): Promise<void> {
    const config = this.#config;
    const schema = this.#schema;
    const { processor, within, constraint } = issue;
    const { profiler } = config;
    const application = new UccProcessor$ConstraintApplication(
      config,
      schema,
      issue,
      await config.resolveFeature(issue),
    );

    config.runWithCurrent({ processor, schema, within, constraint }, () => {
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
