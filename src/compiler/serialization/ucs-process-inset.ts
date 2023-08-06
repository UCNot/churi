import { UcFormatName } from '../../schema/uc-presentations.js';
import { UccFeature } from '../bootstrap/ucc-feature.js';
import { UcsBootstrap } from './ucs-bootstrap.js';

export function ucsProcessInset(boot: UcsBootstrap): UccFeature.Handle<UcsInsetOptions> {
  return {
    constrain({ schema, options: { format } }) {
      boot.formatWith(format, schema);
    },
  };
}

export interface UcsInsetOptions {
  readonly format: UcFormatName;
}
