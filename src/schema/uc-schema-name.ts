import { UcSchema } from './uc-schema.js';

/**
 * Builds human-readable schema name.
 *
 * @param schema - Target schema.
 *
 * @returns String containing schema name.
 */
export function ucSchemaName(schema: UcSchema): string {
  if (typeof schema.toString === 'function' && schema.toString !== Object.prototype.toString) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return schema.toString();
  }

  const { optional, nullable, type } = schema;

  return optional
    ? nullable
      ? `(${type} | null)?`
      : `${type}?`
    : nullable
    ? `(${type} | null)`
    : type;
}
