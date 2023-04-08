import { UcdSetup } from '../compiler/deserialization/ucd-setup.js';
import { UcrxContext } from '../rx/ucrx-context.js';
import { ucrxString } from '../rx/ucrx-item.js';
import { Ucrx } from '../rx/ucrx.js';
import { printUcTokens } from '../syntax/print-uc-token.js';
import { UcToken } from '../syntax/uc-token.js';

export function readPlainEntity(
  context: UcrxContext,
  rx: Ucrx,
  prefix: readonly UcToken[],
  args: readonly UcToken[],
): 0 | 1 {
  return ucrxString(context, rx, printUcTokens([...prefix, ...args]));
}

export function ucdConfigurePlainEntity(setup: UcdSetup): void {
  setup.handleEntityPrefix('!plain', ({ lib, prefix, suffix }) => code => {
    code.write(`${prefix}${lib.import('churi/spec', 'readPlainEntity')}${suffix}`);
  });
}
