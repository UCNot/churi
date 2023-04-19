import { UcDataType, UcModel, UcSchema } from './uc-schema.js';

/**
 * URI charge {@link UcSchema schema} definition that permits `undefined` or missing values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 * @typeParam TOptional - Type of {@link UcSchema#optional optional} flag.
 */
export type UcOptional<
  T,
  TSchema extends UcSchema<T> = UcSchema<T>,
  TOptional extends boolean | undefined = true,
> = Omit<TSchema, 'optional'> & {
  readonly optional: TOptional;
};

/**
 * URI charge {@link UcSchema schema} definition that prohibits `undefined` or missing values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 */
export type UcRequired<T, TSchema extends UcSchema<T> = UcSchema<T>> = Omit<TSchema, 'optional'> & {
  readonly optional?: false | undefined;
};

/**
 * Creates a schema for the given data `type` that allows `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @param type - Original data type.
 *
 * @returns Schema instance.
 */
export function ucOptional<T>(type: UcDataType<T>, optional?: true): UcOptional<T, UcSchema<T>>;

/**
 * Modifies data `model` to allow `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @param model - Model to modify.
 *
 * @returns Modified schema or original one if it is already optional.
 */
export function ucOptional<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  model: UcModel<T, TSchema>,
  optional?: true,
): UcOptional<T, TSchema>;

/**
 * Creates a schema for the given data `type` that prohibits `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @param type - Original data type.
 *
 * @returns Schema instance.
 */
export function ucOptional<T>(type: UcDataType<T>, optional: false): UcRequired<T, UcSchema<T>>;

/**
 * Modifies data `model` to prohibit `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @param model - Model to modify.
 *
 * @returns Modified schema or original one if it prohibits `undefined` values already.
 */
export function ucOptional<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  model: UcModel<T, TSchema>,
  optional: false,
): UcRequired<T, TSchema>;

/**
 * Creates a schema for the given data `type` that allows or prohibits `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TOptional - Type of {@link UcSchema#optional optional} flag.
 * @param type - Original data type.
 * @param optional - Whether to allow `undefined` values.
 *
 * @returns Schema instance.
 */
export function ucOptional<T, TOptional extends boolean | undefined = true>(
  type: UcDataType<T>,
  optional: TOptional,
): UcOptional<T, UcSchema<T>, TOptional>;

/**
 * Modifies data `model` to allow or prohibit `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @typeParam TOptional - Type of {@link UcSchema#optional optional} flag.
 * @param model - Model to modify.
 * @param optional - Whether to allow `undefined` values.
 *
 * @returns Modified schema or original one if its {@link UcSchema#optional optional} constraint matches the requested
 * one.
 */
export function ucOptional<
  T,
  TSchema extends UcSchema<T> = UcSchema<T>,
  TOptional extends boolean | undefined = true,
>(model: UcModel<T, TSchema>, optional: TOptional): UcOptional<T, TSchema, TOptional>;

export function ucOptional<T, TSchema extends UcSchema<T>, TOptional extends boolean | undefined>(
  model: UcModel<T, TSchema>,
  optional: TOptional = true as TOptional,
): unknown {
  if (typeof model === 'function') {
    // Convert class to schema.
    return {
      optional,
      nullable: false,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      type: model as UcDataType<T>,
    } as UcOptional<T, TSchema, TOptional>;
  }

  // Convert schema instance.
  const { optional: oldOptional = false } = model;

  if (optional === oldOptional) {
    return model as UcOptional<T, TSchema, boolean | undefined>;
  }

  return { ...model, optional } as UcOptional<T, TSchema, TOptional>;
}
