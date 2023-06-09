import { UcSchema, ucSchema } from '../uc-schema.js';

export type UcBoolean = boolean;

export namespace UcBoolean {
  export interface Schema extends UcSchema<boolean> {
    readonly type: typeof Boolean;
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
export function ucBoolean(extension?: UcSchema.Extension): UcBoolean.Schema {
  return ucSchema(Boolean, extension) as UcBoolean.Schema;
}
