import { UcDataType, UcSchema, ucSchema } from '../uc-schema.js';

export type UcBigInt = bigint;

export namespace UcBigInt {
  export interface Schema extends UcSchema<bigint> {
    readonly type: UcDataType<UcBigInt>;
  }
}

/**
 * Creates data schema for {@link UcBigInt bigint} values.
 *
 * @param extension - Schema extension.
 *
 * @returns BigInt data schema.
 */
/*#__NO_SIDE_EFFECTS__*/
export function ucBigInt(extension?: UcSchema.Extension): UcBigInt.Schema {
  return ucSchema<bigint>(BigInt, extension);
}
