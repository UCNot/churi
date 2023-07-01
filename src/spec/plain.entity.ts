import { UcdCompiler } from '../compiler/deserialization/ucd-compiler.js';
import { UC_MODULE_SPEC } from '../compiler/impl/uc-modules.js';
import { UccConfig } from '../compiler/processor/ucc-config.js';
import { UcrxContext } from '../rx/ucrx-context.js';
import { Ucrx } from '../rx/ucrx.js';
import { printUcTokens } from '../syntax/print-uc-token.js';
import { UcToken } from '../syntax/uc-token.js';

export function readPlainEntity(
  context: UcrxContext,
  rx: Ucrx,
  prefix: readonly UcToken[],
  args: readonly UcToken[],
): 0 | 1 {
  return rx.str(printUcTokens([...prefix, ...args]), context);
}

export function ucdSupportPlainEntity(compiler: UcdCompiler.Any): UccConfig {
  return {
    configure() {
      compiler.handleEntityPrefix('!plain', ({ register }) => code => {
        code.write(register(UC_MODULE_SPEC.import('readPlainEntity')));
      });
    },
  };
}
