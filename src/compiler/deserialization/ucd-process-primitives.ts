import { UccConfig } from '../bootstrap/ucc-config.js';
import { UcrxSetup } from '../rx/ucrx-setup.js';
import { BigIntUcrxClass } from './bigint.ucrx.class.js';
import { BooleanUcrxClass } from './boolean.ucrx.class.js';
import { NumberUcrxClass } from './number.ucrx.class.js';
import { StringUcrxClass } from './string.ucrx.class.js';

export function ucdProcessPrimitives(setup: UcrxSetup): UccConfig {
  return {
    configure() {
      setup
        .enable(BooleanUcrxClass)
        .enable(BigIntUcrxClass)
        .enable(NumberUcrxClass)
        .enable(StringUcrxClass);
    },
  };
}
