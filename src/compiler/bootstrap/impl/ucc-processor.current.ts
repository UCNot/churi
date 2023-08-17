import { UcProcessorName, UcSchemaConstraint } from '../../../schema/uc-constraints.js';
import { UcPresentationName } from '../../../schema/uc-presentations.js';
import { UcSchema } from '../../../schema/uc-schema.js';

export interface UccProcessor$Current {
  readonly processor?: UcProcessorName | undefined;
  readonly entry?: string | undefined;
  readonly schema?: UcSchema | undefined;
  readonly within?: UcPresentationName | undefined;
  readonly constraint?: UcSchemaConstraint | undefined;
}
