import { UccConfig } from '../compiler/bootstrap/ucc-config.js';
import { UcdBootstrap } from '../compiler/deserialization/ucd-bootstrap.js';
import { UC_MODULE_SPEC } from '../compiler/impl/uc-modules.js';
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

export function ucdProcessPlainEntity(boot: UcdBootstrap): UccConfig {
  return {
    configure() {
      boot.handleFormat('plain', ({ register }) => code => {
        code.write(register(UC_MODULE_SPEC.import(readPlainFormat.name)));
      });
    },
  };
}
