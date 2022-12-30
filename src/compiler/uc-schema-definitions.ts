import { UcSchema } from '../schema/uc-schema.js';
import { UcSchemaCompiler } from './uc-schema-compiler.js';

export interface UcSchemaDefinitions {
  readonly from: string;
  write(generator: UcSchemaCompiler, schema: UcSchema, value: string): void;
}
