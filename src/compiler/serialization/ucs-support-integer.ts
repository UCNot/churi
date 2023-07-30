import { UcInteger } from '../../schema/numeric/uc-integer.js';
import { UccConfig } from '../processor/ucc-config.js';
import { ucsFormatInteger } from './impl/ucs-format-integer.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportInteger(
  setup: UcsSetup,
  target: UcInteger.Schema,
): UccConfig<UcInteger.Variant | undefined> {
  return {
    configure(variant) {
      setup.formatWith('charge', target, ucsFormatInteger(variant));
    },
  };
}
