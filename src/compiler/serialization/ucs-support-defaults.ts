import { UccConfig } from '../processor/ucc-config.js';
import { UcsCompiler } from './ucs-compiler.js';
import { ucsSupportPrimitives } from './ucs-support-primitives.js';

export function ucsSupportDefaults(compiler: UcsCompiler): UccConfig {
  return {
    configure() {
      compiler.enable(ucsSupportPrimitives);
    },
  };
}
