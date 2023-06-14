import { UcDataType, UcSchema, ucSchema } from '../uc-schema.js';

export type UcNumber = number;

export namespace UcNumber {
  export interface Schema extends UcSchema<number> {
    readonly type: UcDataType<UcNumber>;
  }
}

/**
 * Creates data schema for {@link UcNumber number} values.
 *
 * @param extension - Schema extension.
 *
 * @returns Number data schema.
 */
/*#__NO_SIDE_EFFECTS__*/
export function ucNumber(
  extension?: UcSchema.Extension<UcNumber, UcNumber.Schema>,
): UcNumber.Schema {
  return ucSchema<number>(Number, extension);
}
