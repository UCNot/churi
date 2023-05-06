import { UcrxContext } from '../rx/ucrx-context.js';
import { UcrxReject } from '../rx/ucrx-rejection.js';
import { Ucrx } from '../rx/ucrx.js';
import { UcToken } from '../syntax/uc-token.js';

export function ucrxInfinity(
  _context: UcrxContext,
  rx: Ucrx,
  _entity: readonly UcToken[],
  reject: UcrxReject,
): 0 | 1 {
  return rx.num(Infinity, reject);
}

export function ucrxNegativeInfinity(
  _context: UcrxContext,
  rx: Ucrx,
  _entity: readonly UcToken[],
  reject: UcrxReject,
): 0 | 1 {
  return rx.num(-Infinity, reject);
}

export function ucrxNaN(
  _context: UcrxContext,
  rx: Ucrx,
  _entity: readonly UcToken[],
  reject: UcrxReject,
): 0 | 1 {
  return rx.num(NaN, reject);
}
