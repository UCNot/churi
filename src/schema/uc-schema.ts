import { UcInstructions } from './uc-instructions.js';

/**
 * URI charge schema definition.
 *
 * Describes data type along with its serialization format within URI charge.
 *
 * @typeParam T - Implied data type.
 */
export interface UcSchema<out T = unknown> {
  /**
   * Marker method needed for correct type inference.
   *
   * Not supposed to be defined.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __UcSchema__?(value: T): T;

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
   * Per-tool schema processing instructions.
   */
  readonly with?: UcInstructions | undefined;

  /**
   * Custom schema name.
   *
   * Used by {@link ucSchemaName} when defined.
   */
  toString?(): string;
}

export function ucSchema<T>(type: UcSchema.Class<T>): UcSchema<T>;

export function ucSchema<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  spec: UcSchema.Spec<T, TSchema>,
): TSchema;

export function ucSchema<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  spec: UcSchema.Spec<T, TSchema>,
): TSchema {
  if (typeof spec === 'function') {
    return {
      optional: false,
      nullable: false,
      type: spec,
    } as TSchema;
  }

  return spec;
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
    | (UcSchema<T> extends TSchema ? Class<T> : never);

  /**
   * Class constructor useable as URI charge schema.
   *
   * @typeParam T - Implied instance type.
   */
  export type Class<T = unknown> = Constructor<T> | Factory<T>;

  export type Constructor<out T = unknown> = new (...args: never[]) => T;

  export type Factory<out T = unknown> = (...args: never[]) => T;

  /**
   * URI charge schema type of the given specifier.
   *
   * @typeParam TSpec - Schema specifier type.
   */
  export type Of<TSpec extends Spec> = TSpec extends Class<infer T> ? UcSchema<T> : TSpec;

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
