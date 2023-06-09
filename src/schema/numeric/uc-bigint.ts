import { UcSchema, ucSchema } from '../uc-schema.js';

export type UcBigInt = bigint;

export namespace UcBigInt {
  export interface Schema extends UcSchema<bigint> {
    readonly type: typeof BigInt;
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
  return ucSchema(BigInt, extension) as UcBigInt.Schema;
}
