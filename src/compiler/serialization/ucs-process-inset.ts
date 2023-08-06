import { UcFormatName } from '../../schema/uc-presentations.js';
import { UccConfig } from '../bootstrap/ucc-config.js';
import { UcsBootstrap } from './ucs-bootstrap.js';

export function ucsProcessInset(boot: UcsBootstrap): UccConfig<UcsInsetOptions> {
  return {
    configureSchema(schema, { format }) {
      boot.formatWith(format, schema);
    },
  };
}

export interface UcsInsetOptions {
  readonly format: UcFormatName;
}
