import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccConfig } from '../processor/ucc-config.js';
import { ucsFormatBigInt } from './impl/ucs-format-bigint.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportBigInt(setup: UcsSetup): UccConfig<UcBigInt.Variant | void> {
  const configureSchema = (
    target: UcSchema | typeof BigInt,
    variant?: UcBigInt.Variant | void,
  ): void => {
    setup.formatWith('charge', target, ucsFormatCharge(ucsFormatBigInt(variant)));
  };

  return {
    configure() {
      configureSchema(BigInt, undefined);
    },
    configureSchema,
  };
}
