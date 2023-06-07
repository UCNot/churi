import { UcdCompiler } from './ucd-compiler.js';
import { ucdSupportNonFinite } from './ucd-support-non-finite.js';
import { ucdSupportPrimitives } from './ucd-support-primitives.js';

export function ucdSupportDefaults(compiler: UcdCompiler.Any): void {
  compiler.enable(ucdSupportPrimitives).enable(ucdSupportNonFinite);
}
