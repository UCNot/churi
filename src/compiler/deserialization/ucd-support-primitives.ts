import { UccConfig } from '../processor/ucc-config.js';
import { BigIntUcrxClass } from './bigint.ucrx.class.js';
import { BooleanUcrxClass } from './boolean.ucrx.class.js';
import { NumberUcrxClass } from './number.ucrx.class.js';
import { StringUcrxClass } from './string.ucrx.class.js';
import { UcdCompiler } from './ucd-compiler.js';

export function ucdSupportPrimitives(compiler: UcdCompiler.Any): UccConfig {
  return {
    configure() {
      compiler
        .enable(BooleanUcrxClass)
        .enable(BigIntUcrxClass)
        .enable(NumberUcrxClass)
        .enable(StringUcrxClass);
    },
  };
}
