import { UcdSetup } from './ucd-setup.js';
import { ucdSupportNonFinite } from './ucd-support-non-finite.js';
import { ucdSupportPrimitives } from './ucd-support-primitives.js';

export function ucdSupportDefaults(setup: UcdSetup): void {
  setup.enable(ucdSupportPrimitives).enable(ucdSupportNonFinite);
}
