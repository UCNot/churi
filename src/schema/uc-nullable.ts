import { asis } from '@proc7ts/primitives';
import { UcSchema } from './uc-schema.js';

export type UcNullable<
  T,
  TSchema extends UcSchema<T> = UcSchema<T>,
  TNullable extends boolean | undefined = true,
> = Omit<TSchema, 'nullable'> & {
  readonly nullable: TNullable;
};

export type UcNonNullable<T, TSchema extends UcSchema<T> = UcSchema<T>> = Omit<
  TSchema,
  'nullable'
> & {
  readonly nullable?: false | undefined;
};

/**
 * Modifies schema to allow `null` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @param schema - Schema to modify.
 *
 * @returns Modified schema or original one if it is already nullable.
 */
export function ucNullable<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  schema: TSchema,
  nullable?: true,
): UcNullable<T, TSchema>;

/**
 * Modifies schema to prohibit `null` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @param schema - Schema to modify.
 *
 * @returns Modified schema or original one if it prohibits `null` values already.
 */
export function ucNullable<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  schema: TSchema,
  nullable: false,
): UcNonNullable<T, TSchema>;

/**
 * Modifies schema to allow or prohibit `null` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @param schema - Schema to modify.
 * @param nullable - Whether to allow `null` values.
 *
 * @returns Modified schema or original one if its {@link UcSchema#nullable nullable} constraint matches the requested
 * one.
 */
export function ucNullable<
  T,
  TSchema extends UcSchema<T> = UcSchema<T>,
  TNullable extends boolean | undefined = true,
>(schema: TSchema, nullable: TNullable): UcNullable<T, TSchema, TNullable>;

/**
 * Creates a schema for the given class that allows `null` values.
 *
 * @typeParam T - Implied data type.
 * @param dataClass - Target data class.
 *
 * @returns Schema instance.
 */
export function ucNullable<T>(
  dataClass: UcSchema.Class<T>,
  nullable?: true,
): UcNullable<T, UcSchema<T>>;

/**
 * Creates a schema for the given class that prohibits `null` values.
 *
 * @typeParam T - Implied data type.
 * @param dataClass - Target data class.
 *
 * @returns Schema instance.
 */
export function ucNullable<T>(
  dataClass: UcSchema.Class<T>,
  optional: false,
): UcNonNullable<T, UcSchema<T>>;

/**
 * Creates a schema for the given class that allows or prohibits `null` values.
 *
 * @typeParam T - Implied data type.
 * @param dataClass - Target data class.
 * @param optional - Whether to allow `undefined` values.
 *
 * @returns Schema instance.
 */
export function ucNullable<T, TNullable extends boolean | undefined = true>(
  dataClass: UcSchema.Class<T>,
  optional: TNullable,
): UcNullable<T, UcSchema<T>, TNullable>;

export function ucNullable<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  schema: TSchema | UcSchema.Class<T>,
  nullable = true,
): Omit<TSchema, 'nullable'> & { readonly nullable?: boolean | undefined } {
  if (typeof schema === 'function') {
    return {
      optional: false,
      nullable,
      type: schema,
      asis,
    } as Omit<TSchema, 'nullable'> & { readonly nullable?: boolean | undefined };
  }

  const { nullable: oldNullable = false } = schema;

  if (nullable === oldNullable) {
    return schema as Omit<TSchema, 'nullable'> & { readonly nullable: boolean };
  }

  return { ...schema, nullable };
}
