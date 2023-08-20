import { esline } from 'esgen';
import { UcString } from '../../../../schema/string/uc-string.js';
import { ucsWriteAsIs } from '../../../../serializer/ucs-write-asis.js';
import { UC_MODULE_SERIALIZER } from '../../../impl/uc-modules.js';
import { UcsFormatter } from '../../ucs-formatter.js';
import { ucsFormatJSON } from './ucs-format-json.js';

export function ucsFormatJSONString(): UcsFormatter<UcString> {
  return ucsFormatJSON(({ writer, value }) => code => {
    const writeAsIs = UC_MODULE_SERIALIZER.import(ucsWriteAsIs.name);

    code.write(esline`await ${writeAsIs}(${writer}, JSON.stringify(${value}));`);
  });
}
