import { UcrxContext } from './ucrx-context.js';
import { ucrxUnexpectedEntryError, ucrxUnexpectedTypeError } from './ucrx-errors.js';
import { Ucrx } from './ucrx.js';

export function ucrxSuffix(context: UcrxContext, rx: Ucrx, key: string): void {
  const entryRx = ucrxEntry(context, rx, key);

  ucrxString(context, entryRx, '');

  rx.map();
}

export function ucrxEntry(context: UcrxContext, rx: Ucrx, key: string): Ucrx {
  const entryRx = rx.for(key);

  if (entryRx) {
    return entryRx;
  }

  context.error(ucrxUnexpectedEntryError(key));

  return context.opaqueRx;
}

export function ucrxBoolean(context: UcrxContext, rx: Ucrx, value: boolean): void {
  if (!rx.bol(value)) {
    context.error(ucrxUnexpectedTypeError('boolean', rx));
  }
}

export function ucrxBigInt(context: UcrxContext, rx: Ucrx, value: bigint): void {
  if (!rx.big(value)) {
    context.error(ucrxUnexpectedTypeError('bigint', rx));
  }
}

export function ucrxNumber(context: UcrxContext, rx: Ucrx, value: number): void {
  if (!rx.num(value)) {
    context.error(ucrxUnexpectedTypeError('number', rx));
  }
}

export function ucrxString(context: UcrxContext, rx: Ucrx, value: string): void {
  if (!rx.str(value)) {
    context.error(ucrxUnexpectedTypeError('string', rx));
  }
}

export function ucrxNull(context: UcrxContext, rx: Ucrx): void {
  if (!rx.nul()) {
    context.error(ucrxUnexpectedTypeError('null', rx));
  }
}
