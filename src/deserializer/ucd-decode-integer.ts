import { UcrxContext } from '../rx/ucrx-context.js';
import { ucrxRejectType } from '../rx/ucrx-rejection.js';
import { Ucrx } from '../rx/ucrx.js';

export function ucdDecodeInteger(context: UcrxContext, rx: Ucrx, input: string): 0 | 1 {
  // eslint-disable-next-line radix
  const value = parseInt(input);

  if (Number.isNaN(value)) {
    return context.reject(ucrxRejectType(input === '--' ? 'null' : 'string', rx));
  }

  return rx.num(value, context);
}

export function ucdDecodeIntegerOrNull(context: UcrxContext, rx: Ucrx, input: string): 0 | 1 {
  if (input === '--') {
    return rx.nul(context);
  }

  // eslint-disable-next-line radix
  const value = parseInt(input);

  if (Number.isNaN(value)) {
    return context.reject(ucrxRejectType('string', rx));
  }

  return rx.num(value, context);
}
