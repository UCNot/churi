import { UcSchema, UC_DATA_ENCODED } from './uc-schema.js';

/**
 * Schema definition for URI charge {@link UcMap map} represented by JavaScript object.
 *
 * @typeParam TEntries - Per-entry schema type.
 */
export class UcMapSchema<TEntries extends UcMapSchema.Entries> extends UcSchema<
  UcMapSchema.ObjectType<TEntries>
> {

  #flags?: number | undefined;
  #entries: TEntries;

  /**
   * Constructs URI charge map represented by JavaScript object.
   *
   * @param options - Schema initialization options.
   */
  constructor(options: UcMapSchema.Options<TEntries>);

  constructor(options?: UcMapSchema.Options<TEntries>) {
    super();

    this.#entries = options?.entries || ({} as TEntries);
  }

  override get library(): string {
    return '@hatsy/churi';
  }

  override get type(): string {
    return 'map';
  }

  override get flags(): number {
    return (this.#flags ??= this.#detectFlags());
  }

  #detectFlags(): number {
    return Object.values(this.entries).reduce(
      (prev, { flags }) => prev | (flags & UC_DATA_ENCODED),
      0,
    );
  }

  /**
   * Per-entry schema of the map.
   */
  get entries(): TEntries {
    return this.#entries;
  }

  protected override clone(): UcMapSchema<TEntries> {
    const clone = super.clone() as UcMapSchema<TEntries>;

    clone.#entries = this.#entries;
    clone.#flags = this.#flags;

    return clone;
  }

}

export interface UcMapSchema<TEntries extends UcMapSchema.Entries>
  extends UcSchema<UcMapSchema.ObjectType<TEntries>> {
  makeMandatory(
    mandatory?: true,
  ): UcMapSchema<TEntries> & UcSchema.Mandatory<UcMapSchema.ObjectType<TEntries>>;
  makeMandatory(
    mandatory: false,
  ): UcMapSchema<TEntries> & UcSchema.NonMandatory<UcMapSchema.ObjectType<TEntries>>;
  makeMandatory(mandatory: boolean): UcMapSchema<TEntries>;

  makeOptional(
    optional?: true,
  ): UcMapSchema<TEntries> & UcSchema.Optional<UcMapSchema.ObjectType<TEntries>>;
  makeOptional(
    optional: false,
  ): UcMapSchema<TEntries> & UcSchema.NonOptional<UcMapSchema.ObjectType<TEntries>>;
  makeOptional(optional: boolean): UcMapSchema<TEntries>;

  makeNullable(
    nullable?: true,
  ): UcMapSchema<TEntries> & UcSchema.Nullable<UcMapSchema.ObjectType<TEntries>>;
  makeNullable(
    nullable: false,
  ): UcMapSchema<TEntries> & UcSchema.NonNullable<UcMapSchema.ObjectType<TEntries>>;
  makeNullable(nullable: boolean): UcMapSchema<TEntries>;
}

export namespace UcMapSchema {
  /**
   * Options for URI charge map {@link UcMapSchema schema}.
   *
   * @typeParam TEntries - Per-entry schema type.
   */
  export interface Options<TEntries extends Entries> {
    /**
     * Per-entry schema of the map.
     */
    readonly entries: TEntries;
  }

  /**
   * Per-entry schema of the map.
   *
   * Each property corresponds to map entry with data type implied by corresponding schema.
   */
  export interface Entries {
    readonly [key: string]: UcSchema<unknown>;
  }

  /**
   * Type of data object implied by per-entry schema.
   *
   * @typeParam TEntries - Per-entry schema type.
   */
  export type ObjectType<TEntries extends Entries> = {
    [key in keyof TEntries]: UcSchema.DataType<TEntries[key]>;
  };
}
