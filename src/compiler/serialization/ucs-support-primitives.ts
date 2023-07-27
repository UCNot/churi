import { UccConfig } from '../processor/ucc-config.js';
import { UcsSetup } from './ucs-setup.js';
import { ucsSupportBigInt } from './ucs-support-bigint.js';
import { ucsSupportBoolean } from './ucs-support-boolean.js';
import { ucsSupportNumber } from './ucs-support-number.js';
import { ucsSupportString } from './ucs-support-string.js';

export function ucsSupportPrimitives(setup: UcsSetup): UccConfig {
  return {
    configure() {
      setup
        .enable(ucsSupportBoolean)
        .enable(ucsSupportBigInt)
        .enable(ucsSupportNumber)
        .enable(ucsSupportString);
    },
  };
}
