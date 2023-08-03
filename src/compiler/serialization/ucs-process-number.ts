import { UcNumber } from '../../schema/numeric/uc-number.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccConfig } from '../processor/ucc-config.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { ucsFormatNumber } from './impl/ucs-format-number.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsProcessNumber(setup: UcsSetup): UccConfig<UcNumber.Variant | void> {
  const configureSchema = (
    target: UcSchema | typeof Number,
    variant?: UcNumber.Variant | void,
  ): void => {
    setup.formatWith('charge', target, ucsFormatCharge(ucsFormatNumber(variant)));
  };

  return {
    configure() {
      configureSchema(Number);
    },
    configureSchema,
  };
}
