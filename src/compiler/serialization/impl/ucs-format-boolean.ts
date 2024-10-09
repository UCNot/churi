import { esline } from 'esgen';
import { UcBoolean } from '../../../schema/boolean/uc-boolean.js';
import { UC_MODULE_SERIALIZER } from '../../impl/uc-modules.js';
import { UcsFormatter } from '../ucs-formatter.js';

export function ucsFormatBoolean(): UcsFormatter<UcBoolean, UcBoolean.Schema> {
  return ({ writer, value }) =>
    code => {
      const ucsTrue = UC_MODULE_SERIALIZER.import('UCS_TRUE');
      const ucsFalse = UC_MODULE_SERIALIZER.import('UCS_FALSE');

      code.write(
        esline`await ${writer}.ready;`,
        esline`${writer}.write(${value} ? ${ucsTrue} : ${ucsFalse});`,
      );
    };
}
