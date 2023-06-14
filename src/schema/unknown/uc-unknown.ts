import { COMPILER_MODULE } from '../../impl/module-names.js';
import { UcBoolean } from '../boolean/uc-boolean.js';
import { UcBigInt } from '../numeric/uc-bigint.js';
import { UcNumber } from '../numeric/uc-number.js';
import { UcString } from '../string/uc-string.js';
import { UcNullable } from '../uc-nullable.js';
import { UcSchema, ucSchema } from '../uc-schema.js';

/**
 * Unknown data type.
 */
export type UcUnknown = UcBigInt | UcBoolean | UcNumber | UcString | symbol | object;

export namespace UcUnknown {
  /**
   * Schema for unknown data type, except `null`.
   */
  export interface Schema extends UcSchema<UcUnknown> {
    readonly type: 'unknown';
  }
}

const UcUnknown$Schema: UcNullable<UcUnknown, UcUnknown.Schema> = {
  type: 'unknown',
  nullable: true,
  with: {
    deserializer: {
      use: {
        from: COMPILER_MODULE,
        feature: 'UnknownUcrxClass',
      },
    },
    serializer: {
      use: {
        from: COMPILER_MODULE,
        feature: 'ucsSupportUnknown',
      },
    },
  },
};

/**
 * Creates schema for unknown data, including `null`.
 *
 * @param extension - Schema extension.
 *
 * @returns Unknown schema instance.
 */
/*#__NO_SIDE_EFFECTS__*/
export function ucUnknown(
  extension?: UcSchema.Extension<UcUnknown, UcNullable<UcUnknown, UcUnknown.Schema>>,
): UcNullable<UcUnknown, UcUnknown.Schema> {
  return ucSchema<UcUnknown, UcNullable<UcUnknown, UcUnknown.Schema>>(UcUnknown$Schema, extension);
}
