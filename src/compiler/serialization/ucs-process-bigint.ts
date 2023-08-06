import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { ucsFormatBigInt } from './impl/ucs-format-bigint.js';
import { ucsFormatCharge } from './impl/ucs-format-charge.js';
import { UcsBootstrap } from './ucs-bootstrap.js';

export function ucsProcessBigInt(boot: UcsBootstrap): UccConfig<UcBigInt.Variant | void> {
  const configureSchema = (
    target: UcSchema | typeof BigInt,
    variant?: UcBigInt.Variant | void,
  ): void => {
    boot.formatWith('charge', target, ucsFormatCharge(ucsFormatBigInt(variant)));
  };

  return {
    configure() {
      configureSchema(BigInt, undefined);
    },
    configureSchema,
  };
}
