import { UccConfig } from '../bootstrap/ucc-config.js';
import { ucsProcessPrimitives } from './ucs-process-primitives.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsProcessDefaults(setup: UcsSetup): UccConfig {
  return {
    configure() {
      setup.enable(ucsProcessPrimitives);
    },
  };
}
