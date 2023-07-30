import { UcString } from '../../schema/string/uc-string.js';
import { UcDataType } from '../../schema/uc-schema.js';
import { UccConfig } from '../processor/ucc-config.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { ucsFormatString } from './impl/ucs-format-string.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportString(
  setup: UcsSetup,
  target: UcString.Schema | UcDataType<UcString> = String,
): UccConfig<UcString.Variant | void> {
  return {
    configure(variant?: UcString.Variant) {
      setup.formatWith('charge', target, ucsFormatCharge(ucsFormatString(variant)));
    },
  };
}
