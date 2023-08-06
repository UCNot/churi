import { UcNumber } from '../../schema/numeric/uc-number.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { ucsFormatNumber } from './impl/ucs-format-number.js';
import { UcsBootstrap } from './ucs-bootstrap.js';

export function ucsProcessNumber(boot: UcsBootstrap): UccFeature.Handle<UcNumber.Variant> {
  const constrain = (target: UcSchema | typeof Number, variant?: UcNumber.Variant): void => {
    boot.formatWith('charge', target, ucsFormatCharge(ucsFormatNumber(variant)));
  };

  constrain(Number);

  return {
    constrain({ schema, options }) {
      constrain(schema, options);
    },
  };
}
