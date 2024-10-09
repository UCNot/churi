import { esline } from 'esgen';
import { UcBigInt } from '../../../schema/numeric/uc-bigint.js';
import { ucsWriteAsIs } from '../../../serializer/ucs-write-asis.js';
import { ucsWriteBigInt, ucsWriteBigIntOrNumber } from '../../../serializer/ucs-write-bigint.js';
import { UC_MODULE_SERIALIZER } from '../../impl/uc-modules.js';
import { UcsFormatter } from '../ucs-formatter.js';

export function ucsFormatBigInt({
  string = 'parse',
  number = 'parse',
}: UcBigInt.Variant = {}): UcsFormatter<UcBigInt, UcBigInt.Schema> {
  return ({ writer, value }) =>
    code => {
      if (string === 'serialize') {
        const ucsApostrophe = UC_MODULE_SERIALIZER.import('UCS_APOSTROPHE');

        code
          .write(esline`await ${writer}.ready;`)
          .write(esline`${writer}.write(${ucsApostrophe});`);
      }
      if (number === 'serialize') {
        const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);

        code
          .write(esline`await ${writer}.ready;`)
          .write(esline`await ${writeAsIs}(${writer}, ${value}.toString());`);
      } else {
        const writeBigInt = UC_MODULE_SERIALIZER.import(
          number === 'auto' ? ucsWriteBigIntOrNumber.name : ucsWriteBigInt.name,
        );

        code.write(esline`await ${writeBigInt}(${writer}, ${value});`);
      }
    };
}
