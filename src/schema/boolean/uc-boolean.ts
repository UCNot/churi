import { UcDataType, UcSchema, ucSchema } from '../uc-schema.js';

export type UcBoolean = boolean;

export namespace UcBoolean {
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
