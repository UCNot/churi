import { UcdSetup } from './ucd-feature.js';
import { ucdSupportBasic } from './ucd-support-basic.js';
import { ucdSupportNonFinite } from './ucd-support-non-finite.js';

export function ucdSupportDefaults(setup: UcdSetup): void {
  setup.enable(ucdSupportBasic).enable(ucdSupportNonFinite);
}