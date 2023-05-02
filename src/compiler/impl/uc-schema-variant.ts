import { UcSchema } from '../../schema/uc-schema.js';

export type UcSchemaVariant = '' | 'O' | 'N' | 'ON';

export function ucSchemaVariant(schema: UcSchema): UcSchemaVariant {
  return schema.optional ? (schema.nullable ? 'ON' : 'O') : schema.nullable ? 'N' : '';
}
