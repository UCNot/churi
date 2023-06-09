import { UcSchema, ucSchema } from '../uc-schema.js';

export type UcString = string;

export namespace UcString {
  export interface Schema extends UcSchema<string> {
    readonly type: typeof String;
  }
}

/**
 * Creates data schema for {@link UcString string} values.
 *
 * @param extension - Schema extension.
 *
 * @returns String data schema.
 */
/*#__NO_SIDE_EFFECTS__*/
export function ucString(extension?: UcSchema.Extension): UcString.Schema {
  return ucSchema(String, extension) as UcString.Schema;
}
