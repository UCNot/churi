import { UcToken } from '../syntax/uc-token.js';
import { UcrxContext } from './ucrx-context.js';
import {
  ucrxUnexpectedEntryError,
  ucrxUnexpectedNullError,
  ucrxUnexpectedTypeError,
  ucrxUnrecognizedEntityError,
} from './ucrx-errors.js';
import { Ucrx } from './ucrx.js';

export function ucrxSuffix(context: UcrxContext, rx: Ucrx, key: string): 0 | 1 {
  const entryRx = ucrxEntry(context, rx, key);

  if (entryRx) {
    ucrxString(context, entryRx, '');

    rx.map();

    return 1;
  }

  return 0;
}

export function ucrxEntry(context: UcrxContext, rx: Ucrx, key: string): Ucrx | undefined {
  const entryRx = rx.for(key);

  if (entryRx) {
    return entryRx;
  }

  if (entryRx != null) {
    context.error(ucrxUnexpectedTypeError('map', rx));

    return;
  }

  context.error(ucrxUnexpectedEntryError(key));

  return context.opaqueRx;
}

export function ucrxBoolean(context: UcrxContext, rx: Ucrx, value: boolean): 0 | 1 {
  if (rx.bol(value)) {
    return 1;
  }

  context.error(ucrxUnexpectedTypeError('boolean', rx));

  return 0;
}

export function ucrxBigInt(context: UcrxContext, rx: Ucrx, value: bigint): 0 | 1 {
  if (rx.big(value)) {
    return 1;
  }

  context.error(ucrxUnexpectedTypeError('bigint', rx));

  return 0;
}

export function ucrxEntity(context: UcrxContext, rx: Ucrx, value: readonly UcToken[]): 0 | 1 {
  /* istanbul ignore next */
  if (rx.ent(value)) {
    return 1;
  }

  context.error(ucrxUnrecognizedEntityError(value));

  return 0;
}

export function ucrxNumber(context: UcrxContext, rx: Ucrx, value: number): 0 | 1 {
  if (rx.num(value)) {
    return 1;
  }

  context.error(ucrxUnexpectedTypeError('number', rx));

  return 0;
}

export function ucrxString(context: UcrxContext, rx: Ucrx, value: string): 0 | 1 {
  if (rx.str(value)) {
    return 1;
  }

  context.error(ucrxUnexpectedTypeError('string', rx));

  return 0;
}

export function ucrxNull(context: UcrxContext, rx: Ucrx): 0 | 1 {
  if (rx.nul()) {
    return 1;
  }

  context.error(ucrxUnexpectedNullError(rx));

  return 0;
}

export function ucrxItem(context: UcrxContext, rx: Ucrx): 0 | 1 {
  if (rx.em()) {
    return 1;
  }

  context.error(ucrxUnexpectedTypeError('list', rx));

  return 0;
}
