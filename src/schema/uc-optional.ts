import { asis } from '@proc7ts/primitives';
import { UcSchema } from './uc-schema.js';

export type UcOptional<
  T,
  TSchema extends UcSchema<T> = UcSchema<T>,
  TOptional extends boolean | undefined = true,
> = Omit<TSchema, 'optional'> & {
  readonly optional: TOptional;
};

export type UcRequired<T, TSchema extends UcSchema<T> = UcSchema<T>> = Omit<TSchema, 'optional'> & {
  readonly optional?: false | undefined;
};

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
): UcOptional<T, TSchema>;

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
): UcRequired<T, TSchema>;

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
>(schema: TSchema, optional: TOptional): UcOptional<T, TSchema, TOptional>;

/**
 * Creates a schema for the given class that allows `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @param dataClass - Target data class.
 *
 * @returns Schema instance.
 */
export function ucOptional<T>(
  dataClass: UcSchema.Class<T>,
  optional?: true,
): UcOptional<T, UcSchema<T>>;

/**
 * Creates a schema for the given class that prohibits `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @param dataClass - Target data class.
 *
 * @returns Schema instance.
 */
export function ucOptional<T>(
  dataClass: UcSchema.Class<T>,
  optional: false,
): UcRequired<T, UcSchema<T>>;

/**
 * Creates a schema for the given class that allows or prohibits `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @param dataClass - Target data class.
 * @param optional - Whether to allow `undefined` values.
 *
 * @returns Schema instance.
 */
export function ucOptional<T, TOptional extends boolean | undefined = true>(
  dataClass: UcSchema.Class<T>,
  optional: TOptional,
): UcOptional<T, UcSchema<T>, TOptional>;

export function ucOptional<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  schema: TSchema | UcSchema.Class<T>,
  optional = true,
): Omit<TSchema, 'optional'> & { readonly optional?: boolean | undefined } {
  if (typeof schema === 'function') {
    return {
      optional,
      nullable: false,
      type: schema,
      asis,
    } as Omit<TSchema, 'optional'> & { readonly optional?: boolean | undefined };
  }

  const { optional: oldOptional = false } = schema;

  if (optional === oldOptional) {
    return schema as Omit<TSchema, 'optional'> & { readonly optional: boolean };
  }

  return { ...schema, optional };
}
