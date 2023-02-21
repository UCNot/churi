import { asis } from '@proc7ts/primitives';
import { UcSchema, ucSchemaRef, UcSchema__symbol } from './uc-schema.js';

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

export namespace UcOptional {
  /**
   * Specifier of {@link UcOptional optional} URI charge schema.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   * @typeParam TOptional - Type of {@link UcSchema#optional optional} flag.
   */
  export type Spec<
    T = unknown,
    TSchema extends UcSchema<T> = UcSchema<T>,
    TOptional extends boolean | undefined = true,
  > = UcSchema.Spec<T, UcOptional<T, TSchema, TOptional>>;

  /**
   * Reference to {@link UcOptional optional} URI charge schema.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   */
  export type Ref<T = unknown, TSchema extends UcSchema<T> = UcSchema<T>> = UcSchema.Ref<
    T,
    UcOptional<T, TSchema>
  >;
}

/**
 * URI charge {@link UcSchema schema} definition that prohibits `undefined` or missing values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 */
export type UcRequired<T, TSchema extends UcSchema<T> = UcSchema<T>> = Omit<TSchema, 'optional'> & {
  readonly optional?: false | undefined;
};

export namespace UcRequired {
  /**
   * Specifier of {@link UcRequired required} URI charge schema.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   */
  export type Spec<T = unknown, TSchema extends UcSchema<T> = UcSchema<T>> = UcSchema.Spec<
    T,
    UcRequired<T, TSchema>
  >;

  /**
   * Reference to {@link UcRequired required} URI charge schema.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   */
  export type Ref<T = unknown, TSchema extends UcSchema<T> = UcSchema<T>> = UcSchema.Ref<
    T,
    UcRequired<T, TSchema>
  >;
}

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
 * @typeParam TOptional - Type of {@link UcSchema#optional optional} flag.
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
 * @typeParam TOptional - Type of {@link UcSchema#optional optional} flag.
 * @param dataClass - Target data class.
 * @param optional - Whether to allow `undefined` values.
 *
 * @returns Schema instance.
 */
export function ucOptional<T, TOptional extends boolean | undefined = true>(
  dataClass: UcSchema.Class<T>,
  optional: TOptional,
): UcOptional<T, UcSchema<T>, TOptional>;

/**
 * Modifies schema specifier to allow `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @param spec - Schema specifier to modify.
 *
 * @returns Modified schema specifier or original one if it is already optional.
 */
export function ucOptional<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  spec: UcSchema.Spec<T, TSchema>,
  optional?: true,
): UcOptional.Spec<T, TSchema>;

/**
 * Modifies schema specifier to prohibit `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @param spec - Schema specifier to modify.
 *
 * @returns Modified schema specifier or original one if it prohibits `undefined` values already.
 */
export function ucOptional<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  spec: UcSchema.Spec<T, TSchema>,
  optional: false,
): UcRequired.Spec<T, TSchema>;

/**
 * Modifies schema to allow or prohibit `undefined` values.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Original schema type.
 * @typeParam TOptional - Type of {@link UcSchema#optional optional} flag.
 * @param spec - Schema specifier to modify.
 * @param optional - Whether to allow `undefined` values.
 *
 * @returns Modified schema specifier or original one if its {@link UcSchema#optional optional} constraint matches
 * the requested one.
 */
export function ucOptional<
  T,
  TSchema extends UcSchema<T> = UcSchema<T>,
  TOptional extends boolean | undefined = true,
>(spec: UcSchema.Spec<T, TSchema>, optional: TOptional): UcOptional.Spec<T, TSchema, TOptional>;

export function ucOptional<T, TSchema extends UcSchema<T>, TOptional extends boolean | undefined>(
  spec: UcSchema.Spec<T, TSchema>,
  optional: TOptional = true as TOptional,
): unknown {
  if (typeof spec === 'function') {
    // Convert class to schema.
    return {
      optional,
      nullable: false,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      type: spec as UcSchema.Class<T>,
      asis,
    } as UcOptional<T, TSchema, TOptional>;
  }

  if (spec[UcSchema__symbol]) {
    // Convert reference.
    return ucSchemaRef(resolver => ucOptional(resolver.schemaOf(spec), optional));
  }

  // Convert schema instance.
  const { optional: oldOptional = false } = spec;

  if (optional === oldOptional) {
    return spec as UcOptional<T, TSchema, boolean | undefined>;
  }

  return { ...spec, optional } as UcOptional<T, TSchema, TOptional>;
}
