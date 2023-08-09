import { esQuoteKey, esStringLiteral } from 'esgen';
import { UcProcessorName, UcSchemaConstraint } from '../../../schema/uc-constraints.js';
import { UcPresentationName } from '../../../schema/uc-presentations.js';
import { UccBootstrap } from '../ucc-bootstrap.js';
import { UccFeature } from '../ucc-feature.js';

export class UccProcessor$ConstraintIssue<out TOptions> {

  constructor(
    readonly processor: UcProcessorName,
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
}
