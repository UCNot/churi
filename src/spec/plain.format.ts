import { UcdSetup } from '../compiler/deserialization/ucd-setup.js';
import { UC_MODULE_SPEC } from '../compiler/impl/uc-modules.js';
import { UccConfig } from '../compiler/processor/ucc-config.js';
import { UcrxContext } from '../rx/ucrx-context.js';
import { Ucrx } from '../rx/ucrx.js';
import { printUcTokens } from '../syntax/print-uc-token.js';
import { UcToken } from '../syntax/uc-token.js';

export function readPlainFormat(
  context: UcrxContext,
  rx: Ucrx,
  format: string,
  data: readonly UcToken[],
): 0 | 1 {
  return rx.str(`!${format}'${printUcTokens(data)}`, context);
}

export function ucdSupportPlainEntity(setup: UcdSetup): UccConfig {
  return {
    configure() {
      setup.handleFormat('plain', ({ register }) => code => {
        code.write(register(UC_MODULE_SPEC.import('readPlainFormat')));
      });
    },
  };
}
