import { UcModel, ucSchema } from './uc-schema.js';

/**
 * Builds human-readable model name.
 *
 * @param model - Target data model.
 *
 * @returns String containing schema name.
 */
export function ucModelName(model: UcModel): string {
  const schema = ucSchema(model);

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
