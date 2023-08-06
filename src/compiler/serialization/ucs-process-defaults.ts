import { UccConfig } from '../bootstrap/ucc-config.js';
import { UcsBootstrap } from './ucs-bootstrap.js';
import { ucsProcessPrimitives } from './ucs-process-primitives.js';

export function ucsProcessDefaults(boot: UcsBootstrap): UccConfig {
  return {
    configure() {
      boot.enable(ucsProcessPrimitives);
    },
  };
}
