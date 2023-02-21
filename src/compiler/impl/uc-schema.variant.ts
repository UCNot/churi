import { UcSchema } from '../../schema/uc-schema.js';

export type UcSchema$Variant = '' | 'O' | 'N' | 'ON';

export function UcSchema$variantOf(schema: UcSchema): UcSchema$Variant {
  return schema.optional ? (schema.nullable ? 'ON' : 'O') : schema.nullable ? 'N' : '';
}
