import { UcrxContext } from './ucrx-context.js';
import { ucrxUnexpectedEntryError, ucrxUnexpectedTypeError } from './ucrx-errors.js';
import { Ucrx, UcrxMap, UCRX_OPAQUE } from './ucrx.js';

export function ucrxMap(context: UcrxContext, rx: Ucrx): UcrxMap;

export function ucrxMap(context: UcrxContext, rx: Ucrx): UcrxMap {
  if (rx.map) {
    return rx as UcrxMap;
  }

  context.error(ucrxUnexpectedTypeError('map', rx));

  return UCRX_OPAQUE;
}

export function ucrxSuffix(context: UcrxContext, rx: Ucrx, key: string): void {
  const map = ucrxMap(context, rx);
  const entryRx = ucrxEntry(context, map, key);

  ucrxString(context, entryRx, '');

  map.map();
}

export function ucrxEntry(context: UcrxContext, mapRx: UcrxMap, key: string): Ucrx {
  const entryRx = mapRx.for(key);

  if (entryRx) {
    return entryRx;
  }

  context.error(ucrxUnexpectedEntryError(key));

  return UCRX_OPAQUE;
}

export function ucrxString(context: UcrxContext, rx: Ucrx, value: string): void {
  if (!rx.str?.(value) && !rx.any?.(value)) {
    context.error(ucrxUnexpectedTypeError('string', rx));
  }
}

export function ucrxBigInt(context: UcrxContext, rx: Ucrx, value: bigint): void {
  if (!rx.big?.(value) && !rx.any?.(value)) {
    context.error(ucrxUnexpectedTypeError('bigint', rx));
  }
}

export function ucrxBoolean(context: UcrxContext, rx: Ucrx, value: boolean): void {
  if (!rx.bol?.(value) && !rx.any?.(value)) {
    context.error(ucrxUnexpectedTypeError('boolean', rx));
  }
}

export function ucrxNull(context: UcrxContext, rx: Ucrx): void {
  if (!rx.nul?.()) {
    context.error(ucrxUnexpectedTypeError('null', rx));
  }
}

export function ucrxNumber(context: UcrxContext, rx: Ucrx, value: number): void {
  if (!rx.num?.(value) && !rx.any?.(value)) {
    context.error(ucrxUnexpectedTypeError('number', rx));
  }
}
