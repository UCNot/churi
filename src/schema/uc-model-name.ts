import { UcModel, ucSchema } from './uc-schema.js';

/**
 * Builds human-readable model name.
 *
 * @param model - Target data model.
 *
 * @returns String containing schema name.
 */
/*#__NO_SIDE_EFFECTS__*/
export function ucModelName(model: UcModel): string {
  const schema = ucSchema(model);

  if (typeof schema.toString === 'function' && schema.toString !== Object.prototype.toString) {
    return schema.toString();
  }

  const { optional, nullable, type } = schema;
  const typeName = typeof type === 'string' ? type : type.name;

  return optional
    ? nullable
      ? `(${typeName} | null)?`
      : `${typeName}?`
    : nullable
      ? `(${typeName} | null)`
      : typeName;
}
