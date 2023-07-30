import { UcNumber } from '../../schema/numeric/uc-number.js';
import { UcDataType } from '../../schema/uc-schema.js';
import { UccConfig } from '../processor/ucc-config.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { ucsFormatNumber } from './impl/ucs-format-number.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportNumber(
  setup: UcsSetup,
  target: UcNumber.Schema | UcDataType<UcNumber> = Number,
): UccConfig<UcNumber.Variant | void> {
  return {
    configure(variant) {
      setup.formatWith('charge', target, ucsFormatCharge(ucsFormatNumber(variant)));
    },
  };
}
