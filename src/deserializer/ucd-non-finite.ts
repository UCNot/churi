import { UcrxContext } from '../rx/ucrx-context.js';
import { Ucrx } from '../rx/ucrx.js';
import { UcToken } from '../syntax/uc-token.js';

export function ucdInfinity(context: UcrxContext, rx: Ucrx, _name: string): 1 {
  rx.num(Infinity, context);

  return 1;
}

export function ucdNegativeInfinity(context: UcrxContext, rx: Ucrx, _name: string): 1 {
  rx.num(-Infinity, context);

  return 1;
}

export function ucdNaN(context: UcrxContext, rx: Ucrx, _entity: readonly UcToken[]): 1 {
  rx.num(NaN, context);

  return 1;
}
