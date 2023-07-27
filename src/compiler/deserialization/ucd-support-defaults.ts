import { UccConfig } from '../processor/ucc-config.js';
import { UcrxSetup } from '../rx/ucrx-setup.js';
import { ucdSupportNonFinite } from './ucd-support-non-finite.js';
import { ucdSupportPrimitives } from './ucd-support-primitives.js';

export function ucdSupportDefaults(setup: UcrxSetup): UccConfig {
  return {
    configure() {
      setup.enable(ucdSupportPrimitives).enable(ucdSupportNonFinite);
    },
  };
}
