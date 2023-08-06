import { UcString } from '../../schema/string/uc-string.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { ucsFormatString } from './impl/ucs-format-string.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsProcessString(setup: UcsSetup): UccConfig<UcString.Variant | void> {
  const configureSchema = (target: UcSchema | typeof String, variant?: UcString.Variant): void => {
    setup.formatWith('charge', target, ucsFormatCharge(ucsFormatString(variant)));
  };

  return {
    configure() {
      configureSchema(String);
    },
    configureSchema,
  };
}
