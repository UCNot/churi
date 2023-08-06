import { esline } from 'esgen';
import { UcNumber } from '../../../schema/numeric/uc-number.js';
import { ucsWriteNumber, ucsWriteNumberAsString } from '../../../serializer/ucs-write-number.js';
import { UC_MODULE_SERIALIZER } from '../../impl/uc-modules.js';
import { UcsFormatter } from '../ucs-formatter.js';

export function ucsFormatNumber({ string = 'parse' }: UcNumber.Variant = {}): UcsFormatter<
  UcNumber,
  UcNumber.Schema
> {
  return ({ writer, value }) => {
    const writeNumber = UC_MODULE_SERIALIZER.import(
      string === 'serialize' ? ucsWriteNumberAsString.name : ucsWriteNumber.name,
    );

    return esline`await ${writeNumber}(${writer}, ${value});`;
  };
}
