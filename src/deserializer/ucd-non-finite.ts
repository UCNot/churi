import { UcrxContext } from '../rx/ucrx-context.js';
import { UcrxReject } from '../rx/ucrx-rejection.js';
import { Ucrx } from '../rx/ucrx.js';
import { UcToken } from '../syntax/uc-token.js';

export function ucdInfinity(
  _context: UcrxContext,
  rx: Ucrx,
  _entity: readonly UcToken[],
  reject: UcrxReject,
): 1 {
  rx.num(Infinity, reject);

  return 1;
}

export function ucdNegativeInfinity(
  _context: UcrxContext,
  rx: Ucrx,
  _entity: readonly UcToken[],
  reject: UcrxReject,
): 1 {
  rx.num(-Infinity, reject);

  return 1;
}

export function ucdNaN(
  _context: UcrxContext,
  rx: Ucrx,
  _entity: readonly UcToken[],
  reject: UcrxReject,
): 1 {
  rx.num(NaN, reject);

  return 1;
}
