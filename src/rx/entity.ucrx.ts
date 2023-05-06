import { UcToken } from '../syntax/uc-token.js';
import { UcrxContext } from './ucrx-context.js';
import { UcrxReject } from './ucrx-rejection.js';
import { Ucrx } from './ucrx.js';

export type EntityUcrx = (
  context: UcrxContext,
  rx: Ucrx,
  entity: readonly UcToken[],
  reject: UcrxReject,
) => 0 | 1;

export type EntityPrefixUcrx = (
  context: UcrxContext,
  rx: Ucrx,
  prefix: readonly UcToken[],
  args: readonly UcToken[],
  reject: UcrxReject,
) => 0 | 1;
