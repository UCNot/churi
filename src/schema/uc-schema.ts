/**
 * Schema definition of URI-chargeable data.
 *
 * Describes compatible value type and its serialization and deserialization rules.
 *
 * @typeParam T - Implied data type.
 */
export interface UcSchema<T> {
  /**
   * Whether the data is optional.
   *
   * When `true` the data value may be `undefined`.
   */
  readonly optional: boolean;

  /**
   * Whether the data is nullable.
   *
   * When `true` the data value may be `null`.
   */
  readonly nullable: boolean;

  /**
   * Library name supporting this schema.
   *
   * This is typically an NPM module name.
   */
  readonly library: string;

  /**
   * Type name within {@link module}.
   *
   * Code generation for the data type is based on this name.
   */
  readonly type: string;

  /**
   * Flags affecting code generation.
   *
   * A bitmask constructed of `UC_DATA_XXX` bit flags.
   *
   * For compound schema (e.g. list or map) combines flags of nested schemas.
   */
  readonly flags: number;

  /**
   * Makes {@link optional} schema out of this one.
   *
   * @returns Either new schema instance, or this one if it is already optional.
   */
  makeOptional(optional?: true): UcSchema.Optional<T>;

  /**
   * Makes non-{@link optional} schema out of this one.
   *
   * @returns Either new schema instance, or this one if it is already non-{@link optional}.
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

  export interface Options {
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
     * Library name supporting this schema.
     *
     * This is typically an NPM module name.
     */
    readonly library: string;

    /**
     * Type name within {@link module}.
     *
     * Code generation for the data type is based on this name.
     */
    readonly type: string;

    /**
     * Flags affecting code generation.
     *
     * A bitmask constructed of `UC_DATA_XXX` bit flags.
     *
     * For compound schema (e.g. list or map) combines flags of nested schemas.
     */
    readonly flags?: number;
  }

  /**
   * Constructs custom schema definition.
   */
  export interface Constructor {
    new <T>(
      options: Options & { optional?: false | undefined; nullable?: false | undefined },
    ): UcSchema.Mandatory<T>;

    new <T>(
      options: Options & { optional: true; nullable?: false | undefined },
    ): UcSchema.Optional<T>;

    new <T>(
      options: Options & { optional?: false | undefined; nullable: true },
    ): UcSchema.Nullable<T>;

    new <T>(
      options: Options & { optional?: false | undefined; nullable?: true | undefined },
    ): UcSchema.NonOptional<T>;

    new <T>(options: Options & { optional: true; nullable: true }): UcSchema.NonMandatory<T>;

    new <T>(options: Options): UcSchema<T>;
  }

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

/**
 * Abstract schema definition of URI-chargeable data.
 *
 * By default, represents a {@link URISchema.NonMandatory non-mandatory} data schema.
 *
 * @typeParam T - Implied data type.
 */
class DefaultUcSchema<T> implements UcSchema<T> {

  #optional: boolean;
  #nullable: boolean;
  readonly #library: string;
  readonly #type: string;
  readonly #flags: number;

  constructor(options: UcSchema.Options);
  constructor({ optional = false, nullable = false, library, type, flags = 0 }: UcSchema.Options) {
    this.#optional = optional;
    this.#nullable = nullable;
    this.#library = library;
    this.#type = type;
    this.#flags = flags;
  }

  get optional(): boolean {
    return this.#optional;
  }

  get nullable(): boolean {
    return this.#nullable;
  }

  get library(): string {
    return this.#library;
  }

  get type(): string {
    return this.#type;
  }

  get flags(): number {
    return this.#flags;
  }

  makeNullable(nullable?: true): UcSchema.Nullable<T>;
  makeNullable(nullable: false): UcSchema.NonNullable<T>;
  makeNullable(nullable: boolean): UcSchema<T>;

  makeNullable(nullable = true): UcSchema<T> {
    if (this.#nullable === nullable) {
      return this;
    }

    const clone = new (this.constructor as typeof DefaultUcSchema)(this);

    clone.#nullable = nullable;

    return clone as this & UcSchema<T>;
  }

  makeOptional(optional?: true): UcSchema.Optional<T>;
  makeOptional(optional: false): UcSchema.NonOptional<T>;
  makeOptional(optional: boolean): UcSchema<T>;

  makeOptional(optional = true): UcSchema<T> {
    if (this.#optional === optional) {
      return this;
    }

    const clone = new (this.constructor as typeof DefaultUcSchema)(this);

    clone.#optional = optional;

    return clone as this & UcSchema<T>;
  }

}

/**
 * Constructs schema definition of URI-chargeable data.
 */
export const UcSchema: UcSchema.Constructor = DefaultUcSchema as UcSchema.Constructor;
