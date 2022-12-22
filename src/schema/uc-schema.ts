/**
 * Schema definition of URI-chargeable data.
 *
 * Describes compatible value type and its serialization and deserialization rules.
 *
 * @typeParam T - Implied data type.
 */
export abstract class UcSchema<T> {

  #optional = false;
  #nullable = false;

  /**
   * Whether the data is optional.
   *
   * When `true` the data value may be `undefined`.
   *
   * @defaultValue `false`, which means `undefined` data value prohibited.
   */
  get optional(): boolean {
    return this.#optional;
  }

  /**
   * Whether the data is nullable.
   *
   * When `true` the data value may be `null`.
   *
   * @defaultValue `false`, which means `null` data value prohibited.
   */
  get nullable(): boolean {
    return this.#nullable;
  }

  /**
   * Whether the data is mandatory.
   *
   * `true` when the data is both non-{@link optional} and non-{@link nullable}.
   */
  get mandatory(): boolean {
    return !this.optional && !this.nullable;
  }

  /**
   * The name of the library providing support for data processing.
   *
   * This is typically an NPM module name.
   */
  abstract get library(): string;

  /**
   * The name of the type unique within {@link library}.
   *
   * Code generation is based on this name.
   */
  abstract get type(): string;

  /**
   * Flags affecting code generation.
   *
   * A bitmask constructed of `UC_DATA_XXX` bit flags.
   *
   * For compound schema (e.g. list or map) combines flags of nested schemas.
   *
   * @defaultValue `0`.
   */
  get flags(): number {
    return 0;
  }

  /**
   * Makes {@link mandatory} schema out of this one.
   *
   * @returns Either new schema instance, or this one if is is already mandatory.
   */
  makeMandatory(mandatory?: true): UcSchema.Mandatory<T>;

  /**
   * Makes non-{@link mandatory} schema out of this one.
   *
   * @returns Either new schema instance, or this one if is is already non-mandatory.
   */
  makeMandatory(mandatory: false): UcSchema.NonMandatory<T>;

  /**
   * Makes {@link mandatory} schema out of this one.
   *
   * @param optional - Whether to make mandatory schema.
   *
   * @returns Either new schema instance, or this one if `mandatory` flag equals to {@link mandatory} property.
   */
  makeMandatory(mandatory: boolean): UcSchema<T>;

  makeMandatory(mandatory = true): UcSchema<T> {
    if (mandatory === this.mandatory) {
      return this;
    }

    const clone = this.clone();

    clone.#optional = clone.#nullable = !mandatory;

    return clone;
  }

  /**
   * Makes {@link optional} schema out of this one.
   *
   * @returns Either new schema instance, or this one if it is already optional.
   */
  makeOptional(optional?: true): UcSchema.Optional<T>;

  /**
   * Makes non-{@link optional} schema out of this one.
   *
   * @returns Either new schema instance, or this one if it is already non-optional.
   */
  makeOptional(optional: false): UcSchema.NonOptional<T>;

  /**
   * Makes {@link optional} schema out of this one.
   *
   * @param optional - Whether to make optional schema.
   *
   * @returns Either new schema instance, or this one if `optional` flag equals to {@link optional} property.
   */
  makeOptional(optional: boolean): UcSchema<T>;

  makeOptional(optional = true): UcSchema<T> {
    if (this.#optional === optional) {
      return this;
    }

    const clone = this.clone();

    clone.#optional = optional;

    return clone as this & UcSchema<T>;
  }

  /**
   * Makes {@link nullable} schema out of this one.
   *
   * @returns Either new schema instance, or this one if it is already nullable.
   */
  makeNullable(nullable?: true): UcSchema.Nullable<T>;

  /**
   * Makes non-{@link nullable} schema out of this one.
   *
   * @returns Either new schema instance, or this one if it is already non-{@link nullable}.
   */
  makeNullable(nullable: false): UcSchema.NonNullable<T>;

  /**
   * Makes {@link nullable} schema out of this one.
   *
   * @param nullable - Whether to make nullable schema.
   *
   * @returns Either new schema instance, or this one if `nullable` flag equals to {@link nullable} property.
   */
  makeNullable(nullable: boolean): UcSchema<T>;

  makeNullable(nullable = true): UcSchema<T> {
    if (this.#nullable === nullable) {
      return this;
    }

    const clone = this.clone();

    clone.#nullable = nullable;

    return clone as this & UcSchema<T>;
  }

  /**
   * Creates a clone of this schema.
   *
   * By default, calls this class constructor without parameters and copies its non-abstract properties.
   *
   * @returns Schema instance with all properties equal to the ones of this one.
   */
  protected clone(): UcSchema<T> {
    const clone = new (this.constructor as new () => UcSchema<T>)();

    clone.#optional = this.optional;
    clone.#nullable = this.nullable;

    return clone;
  }

}

/**
 * Whether the data value contains text to be encoded/decoded.
 */
export const UC_DATA_ENCODED = 1;

export namespace UcSchema {
  /**
   * Data type implied by particular schema.
   *
   * @typeParam T - Schema type.
   */
  export type DataType<TSchema extends UcSchema<any>> = TSchema extends UcSchema<infer T>
    ? TSchema extends { readonly optional: false }
      ? TSchema extends { readonly nullable: false }
        ? T
        : T | null
      : TSchema extends { readonly nullable: false }
      ? T | undefined
      : T | null | undefined
    : never;

  /**
   * Schema definition that permits `undefined` data values.
   *
   * @typeParam T - Implied data type.
   */
  export interface Optional<T> extends UcSchema<T> {
    readonly optional: true;

    makeNullable(nullable?: true): UcSchema.Optional<T> & UcSchema.Nullable<T>;
    makeNullable(nullable: false): UcSchema.Optional<T> & UcSchema.NonNullable<T>;
    makeNullable(nullable: boolean): UcSchema.Optional<T>;
  }

  /**
   * Schema definition that prohibits `undefined` data values.
   *
   * @typeParam T - Implied data type.
   */
  export interface NonOptional<T> extends UcSchema<T> {
    readonly optional: false;

    makeNullable(nullable?: true): UcSchema.NonOptional<T> & UcSchema.Nullable<T>;
    makeNullable(nullable: false): UcSchema.NonOptional<T> & UcSchema.NonNullable<T>;
    makeNullable(nullable: boolean): UcSchema.NonOptional<T>;
  }

  /**
   * Schema definition that permits `null` data values.
   *
   * @typeParam T - Implied data type.
   */
  export interface Nullable<T> extends UcSchema<T> {
    readonly nullable: true;

    makeOptional(optional?: true): UcSchema.Nullable<T> & UcSchema.Optional<T>;
    makeOptional(optional: false): UcSchema.Nullable<T> & UcSchema.NonOptional<T>;
    makeOptional(optional: boolean): UcSchema.Nullable<T>;
  }

  /**
   * Schema definition that prohibits `null` data values.
   *
   * @typeParam T - Implied data type.
   */
  export interface NonNullable<T> extends UcSchema<T> {
    readonly nullable: false;

    makeOptional(optional?: true): UcSchema.NonNullable<T> & UcSchema.Optional<T>;
    makeOptional(optional: false): UcSchema.NonNullable<T> & UcSchema.NonOptional<T>;
    makeOptional(optional: boolean): UcSchema.NonNullable<T>;
  }

  /**
   * Schema definition that prohibits both `undefined` and `null` data values.
   *
   * @typeParam T - Implied data type.
   */
  export interface Mandatory<T> extends UcSchema<T> {
    readonly optional: false;
    readonly nullable: false;

    makeNullable(nullable?: true): UcSchema.NonOptional<T> & UcSchema.Nullable<T>;
    makeNullable(nullable: false): UcSchema.Mandatory<T>;
    makeNullable(nullable: boolean): UcSchema.NonOptional<T>;

    makeOptional(optional?: true): UcSchema.NonNullable<T> & UcSchema.Optional<T>;
    makeOptional(optional: false): UcSchema.Mandatory<T>;
    makeOptional(optional: boolean): UcSchema.NonNullable<T>;
  }

  /**
   * Schema definition that permits both `undefined` and `null` data values.
   *
   * @typeParam T - Implied data type.
   */
  export interface NonMandatory<T> extends UcSchema<T> {
    readonly optional: true;
    readonly nullable: true;

    makeNullable(nullable?: true): UcSchema.NonMandatory<T>;
    makeNullable(nullable: false): UcSchema.Optional<T> & UcSchema.NonNullable<T>;
    makeNullable(nullable: boolean): UcSchema.Optional<T>;

    makeOptional(optional?: true): UcSchema.NonMandatory<T>;
    makeOptional(optional: false): UcSchema.NonOptional<T> & UcSchema.Nullable<T>;
    makeOptional(optional: boolean): UcSchema.Nullable<T>;
  }
}
