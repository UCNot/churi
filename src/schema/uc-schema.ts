import { UcInstructions } from './uc-instructions.js';

/**
 * Data schema definition.
 *
 * Describes data type along with its serialization format.
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
  readonly type: UcDataType<T> | string;

  /**
   * Unique schema identifier.
   *
   * Types with different {@link optional} and {@link nullable} flags may share the same identifier.
   *
   * Is is up to schema author (or factory function) to make this identifier unique.
   *
   * @defaultValue Equal to {@link type}.
   */
  readonly id?: string | UcDataType | undefined;

  /**
   * Per-tool schema processing instructions.
   */
  readonly with?: UcInstructions | undefined;

  /**
   * Custom schema name.
   *
   * Used by {@link ucModelName} when defined.
   */
  toString?(): string;
}

/**
 * Data model that can be described by {@link UcSchema schema}.
 *
 * Either a {@link UcSchema schema instance}, or {@link UcDataType data class}.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 */
export type UcModel<T = unknown, TSchema extends UcSchema<T> = UcSchema<T>> =
  | TSchema
  | (UcSchema<T> extends TSchema ? UcDataType<T> : never);

/**
 * Data type useable as a {@link UcModel data model}.
 *
 * Either class {@link UcConstructor constructor}, or {@link UcDataFactory data factory}.
 *
 * @typeParam T - Implied instance type.
 */
export type UcDataType<T = unknown> = UcConstructor<T> | UcDataFactory<T>;

/**
 * Class constructor useable as a {@link UcModel data model}.
 *
 * @typeParam T - Implied instance type.
 */
export type UcConstructor<out T = unknown> = new (...args: never[]) => T;

/**
 * Data factory signature useable as a {@link UcModel data model}.
 *
 * @typeParam T - Implied instance type.
 */
export type UcDataFactory<out T = unknown> = (...args: never[]) => T;

/**
 * Creates a {@link UcSchema schema} of the given data `type`.
 *
 * @typeParam T - Implied data type.
 * @param type - Modelled data type.
 *
 * @returns Schema instance.
 */
export function ucSchema<T>(type: UcDataType<T>): UcSchema<T>;

/**
 * Obtains a {@link UcSchema schema} of the given data `model`.
 *
 * @typeParam T - Implied data type.
 * @typeParam TSchema - Schema type.
 * @param model - Data model to obtain a schema of.
 *
 * @returns Either the `model` itself if it is a schema instance already, or schema instance describing the given data
 * type otherwise.
 */
export function ucSchema<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  model: UcModel<T, TSchema>,
): TSchema;

export function ucSchema<T, TSchema extends UcSchema<T> = UcSchema<T>>(
  model: UcModel<T, TSchema>,
): TSchema {
  if (typeof model === 'function') {
    return {
      optional: false,
      nullable: false,
      type: model,
    } as TSchema;
  }

  return model;
}

/**
 * Data type inferred from the given model, including possible {@link UcSchema#nullable null}
 * and {@link UcSchema#optional undefined} values.
 *
 * @typeParam TModel - Model type.
 */
export type UcInfer<TModel extends UcModel> =
  | UcSchema.ImpliedType<TModel>
  | UcSchema.NullableType<UcSchema.Of<TModel>>
  | UcSchema.OptionalType<UcSchema.Of<TModel>>;

export namespace UcSchema {
  /**
   * Schema type corresponding to the given model type.
   *
   * @typeParam TModel - Source model type.
   */
  export type Of<TModel extends UcModel> = TModel extends UcDataType<infer T>
    ? UcSchema<T>
    : TModel;

  /**
   * Data type implied by the given model.
   *
   * Does not include possible {@link UcSchema#nullable null} and {@link UcSchema#optional undefined} values.
   *
   * @typeParam TModel - Model type.
   */
  export type ImpliedType<TModel extends UcModel> = TModel extends UcSchema<infer T>
    ? T
    : TModel extends UcDataType<infer T>
    ? T
    : never;

  export type NullableType<TSchema extends UcSchema> = TSchema extends { readonly nullable: true }
    ? null
    : never;

  export type OptionalType<TSchema extends UcSchema> = TSchema extends { readonly optional: true }
    ? undefined
    : never;
}
