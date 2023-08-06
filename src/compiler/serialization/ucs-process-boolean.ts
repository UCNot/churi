import { UccConfig } from '../bootstrap/ucc-config.js';
import { ucsFormatBoolean } from './impl/ucs-format-boolean.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { UcsBootstrap } from './ucs-bootstrap.js';

export function ucsProcessBoolean(boot: UcsBootstrap): UccConfig {
  return {
    configure() {
      boot.formatWith('charge', Boolean, ucsFormatCharge(ucsFormatBoolean()));
    },
  };
}
