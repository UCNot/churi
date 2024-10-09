import { esline } from 'esgen';
import { UcBoolean } from '../../../../schema/boolean/uc-boolean.js';
import { UC_MODULE_SERIALIZER } from '../../../impl/uc-modules.js';
import { UcsFormatter } from '../../ucs-formatter.js';

export function ucsFormatJSONBoolean(): UcsFormatter<UcBoolean, UcBoolean.Schema> {
  return ({ writer, value }) =>
    code => {
      const jsonTrue = UC_MODULE_SERIALIZER.import('UCS_JSON_TRUE');
      const jsonFalse = UC_MODULE_SERIALIZER.import('UCS_JSON_FALSE');

      code.write(
        esline`await ${writer}.ready;`,
        esline`${writer}.write(${value} ? ${jsonTrue} : ${jsonFalse});`,
      );
    };
}
