import { UcInteger } from '../../schema/numeric/uc-integer.js';
import { UccConfig } from '../processor/ucc-config.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { ucsFormatInteger } from './impl/ucs-format-integer.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportInteger(setup: UcsSetup): UccConfig<UcInteger.Variant | undefined> {
  return {
    configureSchema(schema: UcInteger.Schema, variant) {
      setup.formatWith('charge', schema, ucsFormatCharge(ucsFormatInteger(variant)));
    },
  };
}
