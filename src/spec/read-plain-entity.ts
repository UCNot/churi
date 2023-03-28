import { UcdEntityPrefixDef } from '../compiler/deserialization/ucd-entity-prefix-def.js';
import { UcrxContext } from '../rx/ucrx-context.js';
import { ucrxString } from '../rx/ucrx-value.js';
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

export const PlainEntityUcdDef: UcdEntityPrefixDef = {
  entityPrefix: '!plain',
  createRx({ lib, prefix, suffix }) {
    return `${prefix}${lib.import('@hatsy/churi/spec', 'readPlainEntity')}${suffix}`;
  },
};
