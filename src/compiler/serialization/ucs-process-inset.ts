import { UcFormatName } from '../../schema/uc-presentations.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { UcsSetup } from './ucs-setup.js';

export function ucsProcessInset(setup: UcsSetup): UccConfig<UcsInsetOptions> {
  return {
    configureSchema(schema, { format }) {
      setup.formatWith(format, schema);
    },
  };
}

export interface UcsInsetOptions {
  readonly format: UcFormatName;
}
