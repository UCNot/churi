import { UcsBootstrap } from './ucs-bootstrap.js';
import { ucsProcessPrimitives } from './ucs-process-primitives.js';

export function ucsProcessDefaults(boot: UcsBootstrap): void {
  boot.enable(ucsProcessPrimitives);
}
