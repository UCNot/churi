import { mayHaveProperties } from '@proc7ts/primitives';
import { esQuoteKey, esStringLiteral } from 'esgen';
import { UcFeatureConstraint, UcProcessorName } from '../../../schema/uc-constraints.js';
import { UcPresentationName } from '../../../schema/uc-presentations.js';
import { UcSchema } from '../../../schema/uc-schema.js';
import { UccCapability } from '../ucc-capability.js';
import { UccFeature } from '../ucc-feature.js';
import { UccSetup } from '../ucc-setup.js';
import { UccProcessor$ConstraintConfig } from './ucc-processor.constraint-config.js';
import { UccProcessor$Profiler } from './ucc-processor.profiler.js';

export class UccProcessor$ConstraintApplication<in out TSetup extends UccSetup<TSetup>>
  implements UccCapability.ConstraintApplication<TSetup> {

  readonly #profiler: UccProcessor$Profiler<TSetup>;
  readonly #schema: UcSchema;
  readonly #config: UccProcessor$ConstraintConfig;
  #applied = 0;

  constructor(
    profiler: UccProcessor$Profiler<TSetup>,
    schema: UcSchema,
    config: UccProcessor$ConstraintConfig,
  ) {
    this.#profiler = profiler;
    this.#schema = schema;
    this.#config = config;
  }

  get setup(): TSetup {
    return this.#profiler.setup;
  }

  get schema(): UcSchema {
    return this.#schema;
  }

  get processor(): UcProcessorName {
    return this.#config.processor;
  }

  get within(): UcPresentationName | undefined {
    return this.#config.within;
  }

  get constraint(): UcFeatureConstraint {
    return this.#config.constraint;
  }

  get data(): unknown {
    return this.#config.data;
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
      constraint: { use, from, with: options },
      data,
    } = this;
    const { [use]: feature }: { [name: string]: UccFeature<TSetup, unknown> } = await import(from);

    if ((mayHaveProperties(feature) && 'uccProcess' in feature) || typeof feature === 'function') {
      this.#profiler.enableSchema(schema, this.#config, feature, options, data);
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
    const { use, from } = this.#config.constraint;

    return `import(${esStringLiteral(from)}).${esQuoteKey(use)}`;
  }

}
