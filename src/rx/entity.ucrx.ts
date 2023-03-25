import { UcToken } from '../syntax/uc-token.js';
import { UcrxContext } from './ucrx-context.js';
import { Ucrx } from './ucrx.js';

export type EntityUcrx = (context: UcrxContext, rx: Ucrx, entity: readonly UcToken[]) => 0 | 1;

export type EntityPrefixUcrx = (
  context: UcrxContext,
  rx: Ucrx,
  prefix: readonly UcToken[],
  args: readonly UcToken[],
) => 0 | 1;
