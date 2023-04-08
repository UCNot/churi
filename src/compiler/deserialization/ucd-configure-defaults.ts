import { ucdConfigureBasic } from './ucd-configure-basic.js';
import { ucdConfigureNonFinite } from './ucd-configure-non-finite.js';
import { UcdSetup } from './ucd-setup.js';

export function ucdConfigureDefaults(setup: UcdSetup): void {
  ucdConfigureBasic(setup);
  ucdConfigureNonFinite(setup);
}
