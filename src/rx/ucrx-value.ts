import { UcdReader } from '../deserializer/ucd-reader.js';
import { ucrxUnexpectedEntryError, ucrxUnexpectedTypeError } from './ucrx-errors.js';
import { Ucrx, UcrxMap, UCRX_OPAQUE } from './ucrx.js';

export function ucrxMap(reader: UcdReader, rx: Ucrx): UcrxMap;

export function ucrxMap(reader: UcdReader, rx: Ucrx): UcrxMap {
  if (rx.map) {
    return rx as UcrxMap;
  }

  reader.error(ucrxUnexpectedTypeError('map', rx));

  return UCRX_OPAQUE;
}

export function ucrxSuffix(reader: UcdReader, rx: Ucrx, key: string): void {
  const map = ucrxMap(reader, rx);
  const entryRx = ucrxEntry(reader, map, key);

  ucrxString(reader, entryRx, '');

  map.map();
}

export function ucrxEntry(reader: UcdReader, mapRx: UcrxMap, key: string): Ucrx {
  const entryRx = mapRx.for(key);

  if (entryRx) {
    return entryRx;
  }

  reader.error(ucrxUnexpectedEntryError(key));

  return UCRX_OPAQUE;
}

export function ucrxString(reader: UcdReader, rx: Ucrx, value: string): void {
  if (!rx.str?.(value) && !rx.any?.(value)) {
    reader.error(ucrxUnexpectedTypeError('string', rx));
  }
}

export function ucrxBigInt(reader: UcdReader, rx: Ucrx, value: bigint): void {
  if (!rx.big?.(value) && !rx.any?.(value)) {
    reader.error(ucrxUnexpectedTypeError('bigint', rx));
  }
}

export function ucrxBoolean(reader: UcdReader, rx: Ucrx, value: boolean): void {
  if (!rx.bol?.(value) && !rx.any?.(value)) {
    reader.error(ucrxUnexpectedTypeError('boolean', rx));
  }
}

export function ucrxNull(reader: UcdReader, rx: Ucrx): void {
  if (!rx.nul?.()) {
    reader.error(ucrxUnexpectedTypeError('null', rx));
  }
}

export function ucrxNumber(reader: UcdReader, rx: Ucrx, value: number): void {
  if (!rx.num?.(value) && !rx.any?.(value)) {
    reader.error(ucrxUnexpectedTypeError('number', rx));
  }
}
