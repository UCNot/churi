import { esline } from 'esgen';
import { ucsWriteAsIs } from '../../../../serializer/ucs-write-asis.js';
import { UC_MODULE_SERIALIZER } from '../../../impl/uc-modules.js';
import { UcsFormatter } from '../../ucs-formatter.js';

export function ucsFormatJSONUnknown(): UcsFormatter {
  return ({ writer, value }) =>
    code => {
      const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);

      code.write(esline`await ${writeAsIs}(${writer}, JSON.stringify(${value}));`);
    };
}
