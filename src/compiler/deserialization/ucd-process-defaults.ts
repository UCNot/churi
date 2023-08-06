import { UccConfig } from '../bootstrap/ucc-config.js';
import { UcrxBootstrap } from '../rx/ucrx-bootstrap.js';
import { ucdProcessNonFinite } from './ucd-process-non-finite.js';
import { ucdProcessPrimitives } from './ucd-process-primitives.js';

export function ucdProcessDefaults(boot: UcrxBootstrap): UccConfig {
  return {
    configure() {
      boot.enable(ucdProcessPrimitives).enable(ucdProcessNonFinite);
    },
  };
}
