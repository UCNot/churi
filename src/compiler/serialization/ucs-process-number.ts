import { UcNumber } from '../../schema/numeric/uc-number.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { ucsFormatNumber } from './impl/ucs-format-number.js';
import { UcsBootstrap } from './ucs-bootstrap.js';

export function ucsProcessNumber(boot: UcsBootstrap): UccConfig<UcNumber.Variant | void> {
  const configureSchema = (
    target: UcSchema | typeof Number,
    variant?: UcNumber.Variant | void,
  ): void => {
    boot.formatWith('charge', target, ucsFormatCharge(ucsFormatNumber(variant)));
  };

  return {
    configure() {
      configureSchema(Number);
    },
    configureSchema,
  };
}
