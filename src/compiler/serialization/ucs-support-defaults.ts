import { UcsSetup } from './ucs-setup.js';
import { ucsSupportPrimitives } from './ucs-support-primitives.js';

export function ucsSupportDefaults(setup: UcsSetup): void {
  setup.enable(ucsSupportPrimitives);
}
