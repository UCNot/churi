import { esline } from 'esgen';
import { UcInteger } from '../../../schema/numeric/uc-integer.js';
import { ucsWriteAsIs } from '../../../serializer/ucs-write-asis.js';
import { UC_MODULE_SERIALIZER } from '../../impl/uc-modules.js';
import { UcsFormatter } from '../ucs-formatter.js';

export function ucsFormatInteger({ string = 'parse' }: UcInteger.Variant = {}): UcsFormatter<
  UcInteger,
  UcInteger.Schema
> {
  return ({ writer, value }) => code => {
      const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);

      if (string === 'serialize') {
        const ucsApostrophe = UC_MODULE_SERIALIZER.import('UCS_APOSTROPHE');

        code
          .write(esline`await ${writer}.ready;`)
          .write(esline`${writer}.write(${ucsApostrophe});`);
      }

      code.write(esline`await ${writeAsIs}(${writer}, ${value}.toFixed(0));`);
    };
}
