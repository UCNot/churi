import { UccConfig } from '../processor/ucc-config.js';
import { UcsCompiler } from './ucs-compiler.js';
import { ucsSupportBigInt } from './ucs-support-bigint.js';
import { ucsSupportBoolean } from './ucs-support-boolean.js';
import { ucsSupportNumber } from './ucs-support-number.js';
import { ucsSupportString } from './ucs-support-string.js';

export function ucsSupportPrimitives(compiler: UcsCompiler): UccConfig {
  return {
    configure() {
      compiler
        .enable(ucsSupportBoolean)
        .enable(ucsSupportBigInt)
        .enable(ucsSupportNumber)
        .enable(ucsSupportString);
    },
  };
}
