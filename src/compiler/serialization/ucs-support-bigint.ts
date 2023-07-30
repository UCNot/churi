import { UcBigInt } from '../../schema/numeric/uc-bigint.js';
import { UcDataType } from '../../schema/uc-schema.js';
import { UccConfig } from '../processor/ucc-config.js';
import { ucsFormatBigInt } from './impl/ucs-format-bigint.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportBigInt(
  setup: UcsSetup,
  target: UcBigInt.Schema | UcDataType<UcBigInt> = BigInt,
): UccConfig<UcBigInt.Variant | void> {
  return {
    configure(variant) {
      setup.formatWith('charge', target, ucsFormatBigInt(variant));
    },
  };
}
