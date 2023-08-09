import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UcsBootstrap } from './ucs-bootstrap.js';

export function ucsProcessCharge(boot: UcsBootstrap): UccFeature.Handle {
  return {
    constrain({ schema }) {
      boot.formatWith('charge', schema);
    },
  };
}
