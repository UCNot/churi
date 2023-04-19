import { UcDataType, UcModel, UcSchema } from './uc-schema.js';

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
 * Creates a schema for the given data `type` that allows `null` values.
 *
 * @typeParam T - Implied data type.
 * @param type - Original data type.
 *
 * @returns Schema instance.
 */
export function ucNullable<T>(type: UcDataType<T>, nullable?: true): UcNullable<T, UcSchema<T>>;

/**
 * Modifies data `model` to allow `null` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @param model - Model to modify.
 *
 * @returns Modified schema or original one if it is already nullable.
 */
export function ucNullable<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  model: UcModel<T, TSchema>,
  nullable?: true,
): UcNullable<T, TSchema>;

/**
 * Creates a schema for the given data `type` that prohibits `null` values.
 *
 * @typeParam T - Implied data type.
 * @param type - Original data type.
 *
 * @returns Schema instance.
 */
export function ucNullable<T>(type: UcDataType<T>, optional: false): UcNonNullable<T, UcSchema<T>>;

/**
 * Modifies data `model` to prohibit `null` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @param model - Model to modify.
 *
 * @returns Modified schema or original one if it prohibits `null` values already.
 */
export function ucNullable<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  model: UcModel<T, TSchema>,
  nullable: false,
): UcNonNullable<T, TSchema>;

/**
 * Creates a schema for the given data `type` that allows or prohibits `null` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TNullable - Type of {@link UcSchema#nullable nullable} flag.
 * @param type - Original data type.
 * @param nullable - Whether to allow `null` values.
 *
 * @returns Schema instance.
 */
export function ucNullable<T, TNullable extends boolean | undefined = true>(
  type: UcDataType<T>,
  nullable: TNullable,
): UcNullable<T, UcSchema<T>, TNullable>;

/**
 * Modifies data `model` to allow or prohibit `null` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @typeParam TNullable - Type of {@link UcSchema#nullable nullable} flag.
 * @param model - Model to modify.
 * @param nullable - Whether to allow `null` values.
 *
 * @returns Modified schema or original one if its {@link UcSchema#nullable nullable} constraint matches the requested
 * one.
 */
export function ucNullable<
  T,
  TSchema extends UcSchema<T> = UcSchema<T>,
  TNullable extends boolean | undefined = true,
>(model: UcModel<T, TSchema>, nullable: TNullable): UcNullable<T, TSchema, TNullable>;

export function ucNullable<T, TSchema extends UcSchema<T>, TNullable extends boolean | undefined>(
  model: UcModel<T, TSchema>,
  nullable = true as TNullable,
): unknown {
  if (typeof model === 'function') {
    // Convert class to schema.
    return {
      optional: false,
      nullable,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      type: model as UcDataType<T>,
    } as UcNullable<T, TSchema, TNullable>;
  }

  // Convert schema instance.
  const { nullable: oldNullable = false } = model;

  if (nullable === oldNullable) {
    return model as UcNullable<T, TSchema, boolean>;
  }

  return { ...model, nullable } as UcNullable<T, TSchema, TNullable>;
}
