import { UcdSetup } from '../compiler/deserialization/ucd-setup.js';
import { UC_MODULE_SPEC } from '../compiler/impl/uc-modules.js';
import { UcrxContext } from '../rx/ucrx-context.js';
import { UcrxReject } from '../rx/ucrx-rejection.js';
import { Ucrx } from '../rx/ucrx.js';
import { printUcTokens } from '../syntax/print-uc-token.js';
import { UcToken } from '../syntax/uc-token.js';

export function readPlainEntity(
  _context: UcrxContext,
  rx: Ucrx,
  prefix: readonly UcToken[],
  args: readonly UcToken[],
  reject: UcrxReject,
): 0 | 1 {
  return rx.str(printUcTokens([...prefix, ...args]), reject);
}

export function ucdSupportPlainEntity(setup: UcdSetup): void {
  setup.handleEntityPrefix('!plain', ({ register }) => code => {
    code.write(register(UC_MODULE_SPEC.import('readPlainEntity')));
  });
}
