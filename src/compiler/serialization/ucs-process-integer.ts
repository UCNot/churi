import { UcInteger } from '../../schema/numeric/uc-integer.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { ucsFormatInteger } from './impl/ucs-format-integer.js';
import { UcsBootstrap } from './ucs-bootstrap.js';

export function ucsProcessInteger(boot: UcsBootstrap): UccFeature.Handle<UcInteger.Variant> {
  return {
    constrain({ schema, options }) {
      boot.formatWith('charge', schema, ucsFormatCharge(ucsFormatInteger(options)));
    },
  };
}
