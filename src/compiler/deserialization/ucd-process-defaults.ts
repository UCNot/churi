import { UccConfig } from '../bootstrap/ucc-config.js';
import { UcrxSetup } from '../rx/ucrx-setup.js';
import { ucdProcessNonFinite } from './ucd-process-non-finite.js';
import { ucdProcessPrimitives } from './ucd-process-primitives.js';

export function ucdProcessDefaults(setup: UcrxSetup): UccConfig {
  return {
    configure() {
      setup.enable(ucdProcessPrimitives).enable(ucdProcessNonFinite);
    },
  };
}
