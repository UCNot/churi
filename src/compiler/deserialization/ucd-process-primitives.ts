import { UccConfig } from '../bootstrap/ucc-config.js';
import { UcrxBootstrap } from '../rx/ucrx-bootstrap.js';
import { BigIntUcrxClass } from './bigint.ucrx.class.js';
import { BooleanUcrxClass } from './boolean.ucrx.class.js';
import { NumberUcrxClass } from './number.ucrx.class.js';
import { StringUcrxClass } from './string.ucrx.class.js';

export function ucdProcessPrimitives(boot: UcrxBootstrap): UccConfig {
  return {
    configure() {
      boot
        .enable(BooleanUcrxClass)
        .enable(BigIntUcrxClass)
        .enable(NumberUcrxClass)
        .enable(StringUcrxClass);
    },
  };
}
