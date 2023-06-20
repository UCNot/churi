import { UcrxReject, ucrxRejectType } from '../rx/ucrx-rejection.js';
import { Ucrx } from '../rx/ucrx.js';

export function ucdDecodeInteger(rx: Ucrx, input: string, reject: UcrxReject): 0 | 1 {
  // eslint-disable-next-line radix
  const value = parseInt(input);

  if (Number.isNaN(value)) {
    return reject(ucrxRejectType(input === '--' ? 'null' : 'string', rx));
  }

  return rx.num(value, reject);
}

export function ucdDecodeIntegerOrNull(rx: Ucrx, input: string, reject: UcrxReject): 0 | 1 {
  if (input === '--') {
    return rx.nul(reject);
  }

  // eslint-disable-next-line radix
  const value = parseInt(input);

  if (Number.isNaN(value)) {
    return reject(ucrxRejectType('string', rx));
  }

  return rx.num(value, reject);
}
