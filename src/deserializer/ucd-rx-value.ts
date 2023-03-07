import { ucdUnexpectedEntryError, ucdUnexpectedTypeError } from './ucd-errors.js';
import { UcdReader } from './ucd-reader.js';
import { UcdMapRx, UcdRx, UCD_OPAQUE_RX } from './ucd-rx.js';

export function ucdRxMap(reader: UcdReader, rx: UcdRx): UcdMapRx;

export function ucdRxMap(reader: UcdReader, rx: UcdRx): UcdMapRx {
  if (rx._.map) {
    return rx._ as UcdMapRx;
  }

  reader.error(ucdUnexpectedTypeError('map', rx));

  return UCD_OPAQUE_RX._;
}

export function ucdRxSuffix(reader: UcdReader, rx: UcdRx, key: string): void {
  const map = ucdRxMap(reader, rx);
  const entryRx = ucdRxEntry(reader, map, key);

  ucdRxString(reader, entryRx, '');

  map.map();
}

export function ucdRxEntry(reader: UcdReader, mapRx: UcdMapRx, key: string): UcdRx {
  const entryRx = mapRx.for(key);

  if (entryRx) {
    return entryRx;
  }

  reader.error(ucdUnexpectedEntryError(key));

  return UCD_OPAQUE_RX;
}

export function ucdRxString(reader: UcdReader, rx: UcdRx, value: string): void {
  if (!rx._.str?.(value) && !rx._.any?.(value)) {
    reader.error(ucdUnexpectedTypeError('string', rx));
  }
}

export function ucdRxBigInt(reader: UcdReader, rx: UcdRx, value: bigint): void {
  if (!rx._.big?.(value) && !rx._.any?.(value)) {
    reader.error(ucdUnexpectedTypeError('bigint', rx));
  }
}

export function ucdRxBoolean(reader: UcdReader, rx: UcdRx, value: boolean): void {
  if (!rx._.bol?.(value) && !rx._.any?.(value)) {
    reader.error(ucdUnexpectedTypeError('boolean', rx));
  }
}

export function ucdRxNull(reader: UcdReader, rx: UcdRx): void {
  if (!rx._.nul?.()) {
    reader.error(ucdUnexpectedTypeError('null', rx));
  }
}

export function ucdRxNumber(reader: UcdReader, rx: UcdRx, value: number): void {
  if (!rx._.num?.(value) && !rx._.any?.(value)) {
    reader.error(ucdUnexpectedTypeError('number', rx));
  }
}
