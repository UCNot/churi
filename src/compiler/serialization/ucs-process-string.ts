import { UcString } from '../../schema/string/uc-string.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { ucsFormatString } from './impl/ucs-format-string.js';
import { UcsBootstrap } from './ucs-bootstrap.js';

export function ucsProcessString(boot: UcsBootstrap): UccFeature.Handle<UcString.Variant> {
  const constrain = (target: UcSchema | typeof String, variant?: UcString.Variant): void => {
    boot.formatWith('charge', target, ucsFormatCharge(ucsFormatString(variant)));
  };

  constrain(String);

  return {
    constrain({ schema, options }) {
      constrain(schema, options);
    },
  };
}
