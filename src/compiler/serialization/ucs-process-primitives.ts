import { UccConfig } from '../bootstrap/ucc-config.js';
import { UcsBootstrap } from './ucs-bootstrap.js';
import { ucsProcessBigInt } from './ucs-process-bigint.js';
import { ucsProcessBoolean } from './ucs-process-boolean.js';
import { ucsProcessNumber } from './ucs-process-number.js';
import { ucsProcessString } from './ucs-process-string.js';

export function ucsProcessPrimitives(boot: UcsBootstrap): UccConfig {
  return {
    configure() {
      boot
        .enable(ucsProcessBoolean)
        .enable(ucsProcessBigInt)
        .enable(ucsProcessNumber)
        .enable(ucsProcessString);
    },
  };
}
