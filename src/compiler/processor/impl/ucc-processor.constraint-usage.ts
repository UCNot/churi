import { UcSchema } from '../../../schema/uc-schema.js';
import { UccSetup } from '../ucc-setup.js';
import { UccProcessor$Config } from './ucc-processor.config.js';
import { UccProcessor$ConstraintApplication } from './ucc-processor.constraint-application.js';
import { UccProcessor$ConstraintIssue } from './ucc-processor.constraint-issue.js';

export class UccProcessor$ConstraintUsage<in out TSetup extends UccSetup<TSetup>> {

  readonly #config: UccProcessor$Config<TSetup>;
  readonly #schema: UcSchema;
  readonly #issues: UccProcessor$ConstraintIssue[] = [];

  constructor(config: UccProcessor$Config<TSetup>, schema: UcSchema) {
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
    const application = new UccProcessor$ConstraintApplication(config, schema, issue);

    await config.configureAsync({ processor, schema, within, constraint }, async () => {
      await profiler.findHandler(processor, within, constraint)?.(application);
      if (within) {
        // Apply any presentation handler.
        await profiler.findHandler(processor, undefined, constraint)?.(application);
      }
      if (!application.isIgnored()) {
        await application.apply();
      }
    });
  }

}
