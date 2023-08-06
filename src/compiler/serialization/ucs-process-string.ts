import { UcString } from '../../schema/string/uc-string.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { ucsFormatString } from './impl/ucs-format-string.js';
import { UcsBootstrap } from './ucs-bootstrap.js';

export function ucsProcessString(boot: UcsBootstrap): UccConfig<UcString.Variant | void> {
  const configureSchema = (target: UcSchema | typeof String, variant?: UcString.Variant): void => {
    boot.formatWith('charge', target, ucsFormatCharge(ucsFormatString(variant)));
  };

  return {
    configure() {
      configureSchema(String);
    },
    configureSchema,
  };
}
