import { UcToken } from '../syntax/uc-token.js';
import { UcdReader } from './ucd-reader.js';
import { ucdRxNumber } from './ucd-rx-value.js';
import { UcdRx } from './ucd-rx.js';

export function ucdReadInfinity(reader: UcdReader, rx: UcdRx, _entity: readonly UcToken[]): void {
  ucdRxNumber(reader, rx, Infinity);
}

export function ucdReadNegativeInfinity(
  reader: UcdReader,
  rx: UcdRx,
  _entity: readonly UcToken[],
): void {
  ucdRxNumber(reader, rx, -Infinity);
}

export function ucdReadNaN(reader: UcdReader, rx: UcdRx, _entity: readonly UcToken[]): void {
  ucdRxNumber(reader, rx, NaN);
}
