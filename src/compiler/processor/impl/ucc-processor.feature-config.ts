import { lazyValue } from '@proc7ts/primitives';
import { UcSchema } from '../../../schema/uc-schema.js';
import { UccConfig } from '../ucc-config.js';
import { UccSetup } from '../ucc-setup.js';
import { UccProcessor$Config } from './ucc-processor.config.js';
import { UccProcessor$ConstraintIssue } from './ucc-processor.constraint-issue.js';
import { UccProcessor$Current } from './ucc-processor.current.js';

export class UccProcessor$FeatureConfig<TSetup extends UccSetup<TSetup>, in TOptions = never> {

  readonly #getConfig: () => UccConfig<TOptions>;
  #autoConfigured = false;

  constructor(createConfig: () => UccConfig<TOptions>) {
    this.#getConfig = lazyValue(createConfig);
  }

  configureFeature(config: UccProcessor$Config<TSetup>, options: TOptions, data: unknown): void {
    this.#configureFeature(config, {}, options, data);
  }

  configureSchema(
    config: UccProcessor$Config<TSetup>,
    schema: UcSchema,
    issue: UccProcessor$ConstraintIssue,
  ): void {
    const {
      processor,
      constraint: { with: options },
      data,
    } = issue;

    this.#configureFeature(config, { processor });

    config.configure({ ...issue, schema }, () => {
      this.#getConfig().configureSchema?.(schema, options as TOptions, data);
    });
  }

  #configureFeature(
    config: UccProcessor$Config<TSetup>,
    current: UccProcessor$Current,
    options?: TOptions,
    data?: unknown,
  ): void {
    if (options === undefined && data === undefined) {
      if (this.#autoConfigured) {
        return;
      }

      this.#autoConfigured = true;
    }

    config.configure(current, () => this.#getConfig().configure?.(options!, data));
  }

}
