import { UcSchema } from '../schema/uc-schema.js';
import { UcCodeBuilder } from './uc-code-builder.js';
import { UcSchemaCompiler } from './uc-schema-compiler.js';

export interface UcSchemaDefinitions {
  readonly from: string;
  write(
    compiler: UcSchemaCompiler,
    schema: UcSchema,
    value: string,
    code: UcCodeBuilder,
  ): boolean | void;
}
