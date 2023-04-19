import { UcSchema, ucSchema } from './uc-schema.js';

/**
 * Builds human-readable schema name.
 *
 * @param schema - Target schema.
 *
 * @returns String containing schema name.
 */
export function ucSchemaName(schema: UcSchema.Spec): string;

export function ucSchemaName(dataType: UcSchema.Spec): string {
  const schema = ucSchema(dataType);

  if (typeof schema.toString === 'function' && schema.toString !== Object.prototype.toString) {
    return schema.toString();
  }

  const { optional, nullable, type, id = type } = schema;
  const typeName = typeof id === 'string' ? id : id.name;

  return optional
    ? nullable
      ? `(${typeName} | null)?`
      : `${typeName}?`
    : nullable
    ? `(${typeName} | null)`
    : typeName;
}
