import { esline } from 'esgen';
import { UcString } from '../../../schema/string/uc-string.js';
import {
  ucsWriteNullableRawString,
  ucsWriteRawString,
  ucsWriteString,
} from '../../../serializer/ucs-write-string.js';
import { UC_MODULE_SERIALIZER } from '../../impl/uc-modules.js';
import { UcsFormatter } from '../ucs-formatter.js';

export function ucsFormatString({ raw = 'escape' }: UcString.Variant = {}): UcsFormatter<
  UcString,
  UcString.Schema
> {
  return ({ writer, value, asItem }, schema) => {
    const writeString = UC_MODULE_SERIALIZER.import(
      raw === 'escape'
        ? ucsWriteString.name
        : schema.nullable
          ? ucsWriteNullableRawString.name
          : ucsWriteRawString.name,
    );

    return esline`await ${writeString}(${writer}, ${value}, ${asItem});`;
  };
}
