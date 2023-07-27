import { UccConfig } from '../processor/ucc-config.js';
import { UcsSetup } from './ucs-setup.js';
import { ucsSupportPrimitives } from './ucs-support-primitives.js';

export function ucsSupportDefaults(setup: UcsSetup): UccConfig {
  return {
    configure() {
      setup.enable(ucsSupportPrimitives);
    },
  };
}
