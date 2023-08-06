import { UcInteger } from '../../schema/numeric/uc-integer.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { ucsFormatInteger } from './impl/ucs-format-integer.js';
import { UcsBootstrap } from './ucs-bootstrap.js';

export function ucsProcessInteger(boot: UcsBootstrap): UccConfig<UcInteger.Variant | undefined> {
  return {
    configureSchema(schema: UcInteger.Schema, variant) {
      boot.formatWith('charge', schema, ucsFormatCharge(ucsFormatInteger(variant)));
    },
  };
}
