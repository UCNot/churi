import { UcFeatureConstraint, UcProcessorName } from '../../../schema/uc-constraints.js';
import { UcPresentationName } from '../../../schema/uc-presentations.js';
import { UccConfig } from '../ucc-config.js';

export interface UccProcessor$ConstraintIssue {
  readonly processor: UcProcessorName;
  readonly within: UcPresentationName | undefined;
  readonly constraint: UcFeatureConstraint;
  readonly data: UccConfig.Data | undefined;
}
