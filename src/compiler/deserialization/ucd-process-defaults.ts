import { UcdBootstrap } from './ucd-bootstrap.js';
import { ucdProcessNonFinite } from './ucd-process-non-finite.js';
import { ucdProcessPrimitives } from './ucd-process-primitives.js';

export function ucdProcessDefaults(boot: UcdBootstrap): void {
  boot.enable(ucdProcessPrimitives).enable(ucdProcessNonFinite);
}
