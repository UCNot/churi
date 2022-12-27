import { UcSchema } from '../schema/uc-schema.js';
import { UcWriterGenerator } from './uc-writer-generator.js';

export interface UcDefinitions {
  readonly from: string;
  write(generator: UcWriterGenerator, schema: UcSchema, value: string): void;
}
