import { UcProcessing } from './uc-processing.js';
import { UcSchemaResolver } from './uc-schema-resolver.js';

/**
 * A key of URI charge schema {@link UcSchema.Ref reference} method that resolves to schema instance.
 */
export const UcSchema__symbol = /*#__PURE__*/ Symbol.for('UcSchema');

/**
 * URI charge schema definition.
 *
 * Describes data type along with its serialization format within URI charge.
 *
 * @typeParam T - Implied data type.
 */
export interface UcSchema<out T = unknown> {
  readonly [UcSchema__symbol]?: undefined;

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
   * Either unique type name, or type class.
   *
   * Code generation is based on this name.
   */
  readonly type: UcSchema.Class<T> | string;

  /**
   * Unique schema identifier.
   *
   * Types with different {@link optional} and {@link nullable} flags may share the same identifier.
   *
   * Is is up to schema author (or factory function) to make this identifier unique.
   *
   * @defaultValue Equal to {@link type}.
   */
  readonly id?: string | UcSchema.Class | undefined;

  /**
   * Schema processing instructions.
   */
  readonly process?: UcProcessing | undefined;

  /**
   * Returns the passed-in value.
   *
   * A marker method needed for correct type inference.
   */
  asis?(value: T): T;

  /**
   * Custom schema name.
   *
   * Used by {@link ucSchemaName} when defined.
   */
  toString?(): string;
}

/**
 * Creates URI charge schema {@link UcSchema.Ref reference}.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 * @param resolve - Schema instance resolver.
 *
 * @returns Resolved schema instance or data class.
 */
export function ucSchemaRef<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  resolve: (resolver: UcSchemaResolver) => TSchema | UcSchema.Class<T>,
): UcSchema.Ref<T, TSchema> {
  return {
    [UcSchema__symbol]: resolve,
  };
}

export namespace UcSchema {
  /**
   * Specifier of URI charge schema.
   *
   * Either a {@link UcSchema schema instance}, {@link Ref schema reference}, or supported class constructor.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   */
  export type Spec<T = unknown, TSchema extends UcSchema<T> = UcSchema<T>> =
    | TSchema
    | (UcSchema<T> extends TSchema ? Class<T> : never)
    | Ref<T, TSchema>;

  /**
   * Class constructor useable as URI charge schema.
   *
   * @typeParam T - Implied instance type.
   */
  export type Class<T = unknown> = Constructor<T> | Factory<T>;

  export interface Constructor<out T = unknown> {
    readonly [UcSchema__symbol]?: undefined;
    new (...args: never[]): T;
  }

  export interface Factory<out T = unknown> {
    readonly [UcSchema__symbol]?: undefined;
    (...args: never[]): T;
  }

  /**
   * Reference to URI charge schema.
   *
   * Can be used as schema {@link Spec specifier}. Supposed to be {@link UcSchemaResolver#schemaOf resolved} to schema
   * instance.
   *
   * Can be created by {@link ucSchemaRef} function.
   *
   * @typeParam T - Implied data type.
   * @typeParam TSchema - Schema type.
   */
  export interface Ref<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>> {
    /**
     * Resolves schema instance.
     *
     * @param resolver - Resolver of nested schemae.
     *
     * @returns Resolved schema instance or data class.
     */
    [UcSchema__symbol](this: void, resolver: UcSchemaResolver): TSchema | UcSchema.Class<T>;
  }

  /**
   * URI charge schema type of the given specifier.
   *
   * @typeParam TSpec - Schema specifier type.
   */
  export type Of<TSpec extends Spec> = TSpec extends Ref<unknown, infer TSchema>
    ? TSchema
    : TSpec extends Class<infer T>
    ? UcSchema<T>
    : TSpec;

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
    : TSpec extends Class<infer T>
    ? T
    : never;

  export type NullableType<TSchema extends UcSchema> = TSchema extends { readonly nullable: true }
    ? null
    : never;

  export type OptionalType<TSchema extends UcSchema> = TSchema extends { readonly optional: true }
    ? undefined
    : never;
}
