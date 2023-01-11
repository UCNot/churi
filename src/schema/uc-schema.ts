import { UcSchemaResolver } from './uc-schema-resolver.js';

/**
 * URI charge schema definition.
 *
 * Describes data type along with its serialization format within URI charge.
 *
 * @typeParam T - Implied data type.
 */
export interface UcSchema<out T = unknown> {
  /**
   * Whether the data is optional.
   *
   * When `true` the data value may be `undefined`.
   *
   * @defaultValue `false`, which means `undefined` data value prohibited.
   */
  readonly optional?: boolean | undefined;

  /**
   * Whether the data is nullable.
   *
   * When `true` the data value may be `null`.
   *
   * @defaultValue `false`, which means `null` data value prohibited.
   */
  readonly nullable?: boolean | undefined;

  /**
   * The source of {@link type} definition.
   *
   * This is typically an NPM module name.
   */
  readonly from: string;

  /**
   * The name of the type unique within the {@link from source}.
   *
   * Code generation is based on this name.
   */
  readonly type: string;

  /**
   * Original schema modified by this one.
   *
   * Original schema implies exactly the same data type, but may have different constraints.
   *
   * When set, used to identify the schema and deduplicate schema serializers.
   */
  readonly like?: UcSchema<T>;

  /**
   * Returns the passed-in value.
   *
   * This is a marker method that needs to present in order the type inference to work properly.
   */
  asis(value: T): T;
}

export namespace UcSchema {
  /**
   * Specifier of URI charge schema.
   *
   * Either a {@link UcSchema schema instance}, or {@link Ref schema reference}.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   */
  export type Spec<T = unknown, TSchema extends UcSchema<T> = UcSchema<T>> =
    | TSchema
    | Ref<T, TSchema>;

  /**
   * Reference to URI charge schema.
   *
   * Builds schema instance. Can be used as schema {@link Spec specifier}. Supposed to be
   * {@link UcSchemaResolver#schemaOf resolved} to schema instance.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   * @param resolver - Resolver of nested schemae.
   */
  export type Ref<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> = (
    resolver: UcSchemaResolver,
  ) => TSchema;

  /**
   * URI charge schema type of the given specifier.
   *
   * @typeParam TSpec - Schema specifier type.
   */
  export type Of<TSpec extends Spec> = TSpec extends Ref<unknown, infer TSchema> ? TSchema : TSpec;

  /**
   * Data type compatible with particular URI charge schema, including possible {@link UcSchema#nullable null} and
   * {@link UcSchema#optional undefined} values.
   *
   * @typeParam TSpec - Schema specifier type.
   */
  export type DataType<TSpec extends Spec> =
    | ImpliedType<TSpec>
    | NullableType<Of<TSpec>>
    | OptionalType<Of<TSpec>>;

  /**
   * Data type implied by particular URI charge schema.
   *
   * Does not include possible {@link UcSchema#nullable null} and {@link UcSchema#optional undefined} values.
   *
   * @typeParam TSpec - Schema specifier type.
   */
  export type ImpliedType<TSpec extends Spec> = TSpec extends UcSchema<infer T>
    ? T
    : TSpec extends Ref<infer T>
    ? T
    : never;

  export type NullableType<TSchema extends UcSchema> = TSchema extends { readonly nullable: true }
    ? null
    : never;

  export type OptionalType<TSchema extends UcSchema> = TSchema extends { readonly optional: true }
    ? undefined
    : never;
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

  const { like = schema } = schema;

  return { ...schema, optional, like };
}

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
): Omit<TSchema, 'nullable'> & { readonly nullable: true };

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
): Omit<TSchema, 'nullable'> & { readonly nullable?: false | undefined };

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
>(
  schema: TSchema,
  nullable: TNullable,
): Omit<TSchema, 'nullable'> & { readonly nullable: TNullable };

export function ucNullable<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  schema: TSchema,
  nullable = true,
): Omit<TSchema, 'nullable'> & { readonly nullable?: boolean | undefined } {
  const { nullable: oldNullable = false } = schema;

  if (nullable === oldNullable) {
    return schema as Omit<TSchema, 'nullable'> & { readonly nullable: boolean };
  }

  const { like = schema } = schema;

  return { ...schema, nullable, like };
}
