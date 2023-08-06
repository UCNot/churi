import { UcrxBootstrap } from '../rx/ucrx-bootstrap.js';
import { ucdProcessNonFinite } from './ucd-process-non-finite.js';
import { ucdProcessPrimitives } from './ucd-process-primitives.js';

export function ucdProcessDefaults(boot: UcrxBootstrap): void {
  boot.enable(ucdProcessPrimitives).enable(ucdProcessNonFinite);
}
