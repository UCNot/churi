import { UcSchema } from './uc-schema.js';

/**
 * URI charge {@link UcSchema schema} definition that permits `null` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 * @typeParam TNullable - Type of {@link UcSchema#nullable nullable} flag.
 */
export type UcNullable<
  T,
  TSchema extends UcSchema<T> = UcSchema<T>,
  TNullable extends boolean | undefined = true,
> = Omit<TSchema, 'nullable'> & {
  readonly nullable: TNullable;
};

/**
 * URI charge {@link UcSchema schema} definition that prohibits `null` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 */
export type UcNonNullable<T, TSchema extends UcSchema<T> = UcSchema<T>> = Omit<
  TSchema,
  'nullable'
> & {
  readonly nullable?: false | undefined;
};

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
 * Modifies schema to allow `null` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @param schema - Schema to modify.
 *
 * @returns Modified schema or original one if it is already nullable.
 */
export function ucNullable<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  schema: UcSchema.Spec<T, TSchema>,
  nullable?: true,
): UcNullable<T, TSchema>;

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
 * Modifies schema to prohibit `null` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @param schema - Schema to modify.
 *
 * @returns Modified schema or original one if it prohibits `null` values already.
 */
export function ucNullable<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  schema: UcSchema.Spec<T, TSchema>,
  nullable: false,
): UcNonNullable<T, TSchema>;

/**
 * Creates a schema for the given class that allows or prohibits `null` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TNullable - Type of {@link UcSchema#nullable nullable} flag.
 * @param dataClass - Target data class.
 * @param nullable - Whether to allow `null` values.
 *
 * @returns Schema instance.
 */
export function ucNullable<T, TNullable extends boolean | undefined = true>(
  dataClass: UcSchema.Class<T>,
  nullable: TNullable,
): UcNullable<T, UcSchema<T>, TNullable>;

/**
 * Modifies schema to allow or prohibit `null` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @typeParam TNullable - Type of {@link UcSchema#nullable nullable} flag.
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
>(schema: UcSchema.Spec<T, TSchema>, nullable: TNullable): UcNullable<T, TSchema, TNullable>;

export function ucNullable<T, TSchema extends UcSchema<T>, TNullable extends boolean | undefined>(
  spec: UcSchema.Spec<T, TSchema>,
  nullable = true as TNullable,
): unknown {
  if (typeof spec === 'function') {
    // Convert class to schema.
    return {
      optional: false,
      nullable,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      type: spec as UcSchema.Class<T>,
    } as UcNullable<T, TSchema, TNullable>;
  }

  // Convert schema instance.
  const { nullable: oldNullable = false } = spec;

  if (nullable === oldNullable) {
    return spec as UcNullable<T, TSchema, boolean>;
  }

  return { ...spec, nullable } as UcNullable<T, TSchema, TNullable>;
}
