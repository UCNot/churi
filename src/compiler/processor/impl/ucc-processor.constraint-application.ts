import { mayHaveProperties } from '@proc7ts/primitives';
import { esQuoteKey, esStringLiteral } from 'esgen';
import { UcFeatureConstraint, UcProcessorName } from '../../../schema/uc-constraints.js';
import { UcPresentationName } from '../../../schema/uc-presentations.js';
import { UcSchema } from '../../../schema/uc-schema.js';
import { UccCapability } from '../ucc-capability.js';
import { UccFeature } from '../ucc-feature.js';
import { UccSetup } from '../ucc-setup.js';
import { UccProcessor$Config } from './ucc-processor.config.js';
import { UccProcessor$ConstraintIssue } from './ucc-processor.constraint-issue.js';

export class UccProcessor$ConstraintApplication<in out TSetup extends UccSetup<TSetup>>
  implements UccCapability.ConstraintApplication<TSetup> {

  readonly #config: UccProcessor$Config<TSetup>;
  readonly #schema: UcSchema;
  readonly #issue: UccProcessor$ConstraintIssue;
  #applied = 0;

  constructor(
    config: UccProcessor$Config<TSetup>,
    schema: UcSchema,
    issue: UccProcessor$ConstraintIssue,
  ) {
    this.#config = config;
    this.#schema = schema;
    this.#issue = issue;
  }

  get setup(): TSetup {
    return this.#config.setup;
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

  get constraint(): UcFeatureConstraint {
    return this.#issue.constraint;
  }

  get data(): unknown {
    return this.#issue.data;
  }

  isApplied(): boolean {
    return this.#applied > 0;
  }

  isIgnored(): boolean {
    return this.#applied < 0;
  }

  async apply(): Promise<void> {
    if (this.isApplied()) {
      return;
    }

    this.#applied = 1;

    const {
      schema,
      constraint: { use, from },
    } = this;
    const { [use]: feature }: { [name: string]: UccFeature<TSetup, unknown> } = await import(from);

    if ((mayHaveProperties(feature) && 'uccProcess' in feature) || typeof feature === 'function') {
      this.#config.enableSchema(schema, feature, this.#issue);
    } else if (feature === undefined) {
      throw new ReferenceError(`No such schema processing feature: ${this}`);
    } else {
      throw new ReferenceError(`Not a schema processing feature: ${this}`);
    }
  }

  ignore(): void {
    if (!this.isApplied()) {
      this.#applied = -1;
    }
  }

  toString(): string {
    const { use, from } = this.#issue.constraint;

    return `import(${esStringLiteral(from)}).${esQuoteKey(use)}`;
  }

}
