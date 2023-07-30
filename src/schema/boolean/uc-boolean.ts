import { UcDataType, UcSchema, ucSchema } from '../uc-schema.js';

/**
 * Boolean type alias used in {@link UcBoolean.Schema schema} processing.
 */
export type UcBoolean = boolean;

export namespace UcBoolean {
  /**
   * Schema for {@link UcBoolean boolean value}.
   *
   * Boolean schema is created automatically when [Boolean] constructor is used as model.
   *
   * BigInt values may be represented with and without `0n` prefix. This differs from schema-less processing,
   * where `0n` prefix is required for BigInt values. When serializing, the `0n` prefix is either added or not
   * according to {@link Variant#number number processing policy}.
   *
   * [Boolean]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean/Boolean
   */
  export interface Schema extends UcSchema<boolean> {
    readonly type: UcDataType<UcBoolean>;
  }
}

/**
 * Creates data schema for {@link UcBoolean boolean} values.
 *
 * @param extension - Schema extension.
 *
 * @returns Boolean data schema.
 */
/*#__NO_SIDE_EFFECTS__*/
export function ucBoolean(
  extension?: UcSchema.Extension<UcBoolean, UcBoolean.Schema>,
): UcBoolean.Schema {
  return ucSchema<boolean>(Boolean, extension);
}
