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
   * Flags affecting code generation.
   *
   * A bitmask constructed of `UC_DATA_XXX` bit flags.
   *
   * For compound schema (e.g. list or map) combines flags of nested schemas.
   *
   * @defaultValue `0`.
   */
  readonly flags?: number;

  /**
   * Returns the passed-in value.
   *
   * This is a marker method that needs to present in order the type inference to work properly.
   */
  asis(value: T): T;
}

/**
 * Whether the data value contains text to be encoded/decoded.
 */
export const UC_DATA_ENCODED = 1;

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
   * @param resolver -
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
    | NullableTypeOf<Of<TSpec>>
    | OptionalTypeOf<Of<TSpec>>;

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

  type NullableTypeOf<TSchema extends UcSchema> = TSchema extends { readonly nullable: true }
    ? null
    : never;

  type OptionalTypeOf<TSchema extends UcSchema> = TSchema extends { readonly optional: true }
    ? undefined
    : never;

  /**
   * Schema definition that permits `undefined` data values.
   *
   * @typeParam T - Implied data type.
   */
  export interface Optional<T> extends UcSchema<T> {
    readonly optional: true;
  }

  /**
   * Schema definition that prohibits `undefined` data values.
   *
   * @typeParam T - Implied data type.
   */
  export interface NonOptional<T> extends UcSchema<T> {
    readonly optional?: false | undefined;
  }

  /**
   * Schema definition that permits `null` data values.
   *
   * @typeParam T - Implied data type.
   */
  export interface Nullable<T> extends UcSchema<T> {
    readonly nullable: true;
  }

  /**
   * Schema definition that prohibits `null` data values.
   *
   * @typeParam T - Implied data type.
   */
  export interface NonNullable<T> extends UcSchema<T> {
    readonly nullable?: false | undefined;
  }

  /**
   * Schema definition that permits both `undefined` and `null` data values.
   *
   * @typeParam T - Implied data type.
   */
  export interface NonMandatory<T> extends UcSchema<T> {
    readonly optional: true;
    readonly nullable: true;
  }
}
