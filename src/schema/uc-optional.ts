import { UcSchema } from './uc-schema.js';

/**
 * Modifies schema to allow `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @param schema - Schema to modify.
 *
 * @returns Modified schema or original one if it is already optional.
 */
export function ucOptional<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  schema: TSchema,
  optional?: true,
): Omit<TSchema, 'optional'> & { readonly optional: true };

/**
 * Modifies schema to prohibit `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @param schema - Schema to modify.
 *
 * @returns Modified schema or original one if it prohibits `undefined` values already.
 */
export function ucOptional<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  schema: TSchema,
  optional: false,
): Omit<TSchema, 'optional'> & { readonly optional?: false | undefined };

/**
 * Modifies schema to allow or prohibit `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @param schema - Schema to modify.
 * @param optional - Whether to allow `undefined` values.
 *
 * @returns Modified schema or original one if its {@link UcSchema#optional optional} constraint matches the requested
 * one.
 */
export function ucOptional<
  T,
  TSchema extends UcSchema<T> = UcSchema<T>,
  TOptional extends boolean | undefined = true,
>(
  schema: TSchema,
  optional: TOptional,
): Omit<TSchema, 'optional'> & { readonly optional: TOptional };

export function ucOptional<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  schema: TSchema,
  optional = true,
): Omit<TSchema, 'optional'> & { readonly optional?: boolean | undefined } {
  const { optional: oldOptional = false } = schema;

  if (optional === oldOptional) {
    return schema as Omit<TSchema, 'optional'> & { readonly optional: boolean };
  }

  return { ...schema, optional };
}
