import { UcsCompiler } from './ucs-compiler.js';
import { ucsSupportPrimitives } from './ucs-support-primitives.js';

export function ucsSupportDefaults(compiler: UcsCompiler): void {
  compiler.enable(ucsSupportPrimitives);
}
