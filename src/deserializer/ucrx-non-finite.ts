import { UcrxContext } from '../rx/ucrx-context.js';
import { ucrxNumber } from '../rx/ucrx-value.js';
import { Ucrx } from '../rx/ucrx.js';
import { UcToken } from '../syntax/uc-token.js';

export function ucrxInfinity(context: UcrxContext, rx: Ucrx, _entity: readonly UcToken[]): 0 | 1 {
  return ucrxNumber(context, rx, Infinity);
}

export function ucrxNegativeInfinity(
  context: UcrxContext,
  rx: Ucrx,
  _entity: readonly UcToken[],
): 0 | 1 {
  return ucrxNumber(context, rx, -Infinity);
}

export function ucrxNaN(context: UcrxContext, rx: Ucrx, _entity: readonly UcToken[]): 0 | 1 {
  return ucrxNumber(context, rx, NaN);
}
