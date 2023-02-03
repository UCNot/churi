import { UcSchema } from '../../schema/uc-schema.js';
import { UccCode } from '../ucc-code.js';
import { UcsFunction } from './ucs-function.js';

export interface UcsDef {
  readonly type: string;
  serialize(
    serializer: UcsFunction,
    schema: UcSchema,
    value: string,
    asItem: string,
  ): UccCode.Source | undefined;
}
