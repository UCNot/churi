import { DESERIALIZER_MODULE, SERIALIZER_MODULE } from '../../impl/module-names.js';
import { UcBoolean } from '../boolean/uc-boolean.js';
import { UcBigInt } from '../numeric/uc-bigint.js';
import { UcNumber } from '../numeric/uc-number.js';
import { UcString } from '../string/uc-string.js';
import { UcNullable } from '../uc-nullable.js';
import { UcSchema } from '../uc-schema.js';

export type UcUnknown = UcBigInt | UcBoolean | UcNumber | UcString | symbol | object;

export namespace UcUnknown {
  export interface Schema extends UcSchema<UcUnknown> {
    readonly type: 'unknown';
  }
}

const UcUnknown$Schema: UcNullable<UcUnknown, UcUnknown.Schema> = {
  type: 'unknown',
  nullable: true,
  process: {
    deserializer: {
      from: DESERIALIZER_MODULE,
      feature: 'UnknownUcrxTemplate',
    },
    serializer: {
      from: SERIALIZER_MODULE,
      feature: 'ucsSupportUnknown',
    },
  },
};

export function ucUnknown(): UcNullable<UcUnknown, UcUnknown.Schema> {
  return UcUnknown$Schema;
}
