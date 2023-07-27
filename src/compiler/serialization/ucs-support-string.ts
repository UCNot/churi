import { esline } from 'esgen';
import { UcString } from '../../schema/string/uc-string.js';
import { UcDataType } from '../../schema/uc-schema.js';
import { UC_MODULE_SERIALIZER } from '../impl/uc-modules.js';
import { UccConfig } from '../processor/ucc-config.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportString(
  setup: UcsSetup,
  target: UcString.Schema | UcDataType<UcString> = String,
): UccConfig<UcString.Variant | void> {
  return {
    configure({ raw = 'escape' } = {}) {
      setup.formatWith('charge', target, ({ writer, value, asItem }, schema) => {
        const writeString = UC_MODULE_SERIALIZER.import(
          raw === 'escape'
            ? 'ucsWriteString'
            : schema.nullable
            ? 'ucsWriteNullableRawString'
            : 'ucsWriteRawString',
        );

        return esline`await ${writeString}(${writer}, ${value}, ${asItem});`;
      });
    },
  };
}
