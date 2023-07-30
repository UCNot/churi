import { UccConfig } from '../processor/ucc-config.js';
import { ucsFormatBoolean } from './impl/ucs-format-boolean.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsSupportBoolean(setup: UcsSetup): UccConfig {
  return {
    configure() {
      setup.formatWith('charge', Boolean, ucsFormatBoolean());
    },
  };
}
