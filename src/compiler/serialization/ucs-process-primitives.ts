import { UccConfig } from '../bootstrap/ucc-config.js';
import { ucsProcessBigInt } from './ucs-process-bigint.js';
import { ucsProcessBoolean } from './ucs-process-boolean.js';
import { ucsProcessNumber } from './ucs-process-number.js';
import { ucsProcessString } from './ucs-process-string.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsProcessPrimitives(setup: UcsSetup): UccConfig {
  return {
    configure() {
      setup
        .enable(ucsProcessBoolean)
        .enable(ucsProcessBigInt)
        .enable(ucsProcessNumber)
        .enable(ucsProcessString);
    },
  };
}
