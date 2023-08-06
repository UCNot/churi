import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { ucsFormatBigInt } from './impl/ucs-format-bigint.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { UcsBootstrap } from './ucs-bootstrap.js';

export function ucsProcessBigInt(boot: UcsBootstrap): UccFeature.Handle<UcBigInt.Variant> {
  const constrain = (target: UcSchema | typeof BigInt, variant?: UcBigInt.Variant): void => {
    boot.formatWith('charge', target, ucsFormatCharge(ucsFormatBigInt(variant)));
  };

  constrain(BigInt);

  return {
    constrain({ schema, options }) {
      constrain(schema, options);
    },
  };
}
