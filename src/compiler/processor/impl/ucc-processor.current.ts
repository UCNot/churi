import { UcFeatureConstraint, UcProcessorName } from '../../../schema/uc-constraints.js';
import { UcPresentationName } from '../../../schema/uc-presentations.js';
import { UcSchema } from '../../../schema/uc-schema.js';

export interface UccProcessor$Current {
  readonly processor?: UcProcessorName | undefined;
  readonly schema?: UcSchema | undefined;
  readonly within?: UcPresentationName | undefined;
  readonly constraint?: UcFeatureConstraint | undefined;
}
