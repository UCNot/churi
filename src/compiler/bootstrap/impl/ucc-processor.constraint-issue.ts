import { esQuoteKey, esStringLiteral } from 'esgen';
import { UcProcessorName, UcSchemaConstraint } from '../../../schema/uc-constraints.js';
import { UcPresentationName } from '../../../schema/uc-presentations.js';
import { UcSchema } from '../../../schema/uc-schema.js';
import { UccBootstrap } from '../ucc-bootstrap.js';
import { UccFeature } from '../ucc-feature.js';
import { UccProcessor$Current } from './ucc-processor.current.js';

export class UccProcessor$ConstraintIssue<out TOptions> implements UccProcessor$Current {

  constructor(
    readonly processor: UcProcessorName,
    readonly entry: string | undefined,
    readonly schema: UcSchema,
    readonly within: UcPresentationName | undefined,
    readonly constraint: UcSchemaConstraint,
  ) {}

  get options(): TOptions {
    return this.constraint.with as TOptions;
  }

  toString(): string {
    const { use, from } = this.constraint;

    return `import(${esStringLiteral(from)}).${esQuoteKey(use)}`;
  }

}

export interface UccProcessor$ConstraintResolution<
  in TBoot extends UccBootstrap<TBoot>,
  in out TOptions,
> {
  readonly issue: UccProcessor$ConstraintIssue<TOptions>;
  readonly feature: UccFeature<TBoot, TOptions>;
  readonly handle: UccFeature.Handle<TOptions>;
}
