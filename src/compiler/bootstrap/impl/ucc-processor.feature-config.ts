import { lazyValue } from '@proc7ts/primitives';
import { UcSchema } from '../../../schema/uc-schema.js';
import { UccBootstrap } from '../ucc-bootstrap.js';
import { UccConfig } from '../ucc-config.js';
import { UccProcessor$Config } from './ucc-processor.config.js';
import { UccProcessor$ConstraintIssue } from './ucc-processor.constraint-issue.js';
import { UccProcessor$Current } from './ucc-processor.current.js';

export class UccProcessor$FeatureConfig<TBoot extends UccBootstrap<TBoot>, in TOptions = never> {

  readonly #getConfig: () => UccConfig<TOptions>;
  #autoConfigured = false;

  constructor(createConfig: () => UccConfig<TOptions>) {
    this.#getConfig = lazyValue(createConfig);
  }

  configureFeature(config: UccProcessor$Config<TBoot>, options: TOptions): void {
    this.#configureFeature(config, {}, options);
  }

  configureSchema(
    config: UccProcessor$Config<TBoot>,
    schema: UcSchema,
    issue: UccProcessor$ConstraintIssue,
  ): void {
    const {
      processor,
      constraint: { with: options },
    } = issue;

    this.#configureFeature(config, { processor });

    config.configure({ ...issue, schema }, () => {
      this.#getConfig().configureSchema?.(schema, options as TOptions);
    });
  }

  #configureFeature(
    config: UccProcessor$Config<TBoot>,
    current: UccProcessor$Current,
    options?: TOptions,
  ): void {
    if (options === undefined) {
      if (this.#autoConfigured) {
        return;
      }

      this.#autoConfigured = true;
    }

    config.configure(current, () => this.#getConfig().configure?.(options!));
  }

}
