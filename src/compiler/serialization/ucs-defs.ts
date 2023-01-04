import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UcsFunction } from './ucs-function.js';

export interface UcsDefs {
  readonly from: string;
  serialize(serializer: UcsFunction, schema: UcSchema, value: string): UccCode.Source | undefined;
}
