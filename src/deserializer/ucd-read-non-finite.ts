import { ucrxNumber } from '../rx/ucrx-value.js';
import { Ucrx } from '../rx/ucrx.js';
import { UcToken } from '../syntax/uc-token.js';
import { UcdReader } from './ucd-reader.js';

export function ucdReadInfinity(reader: UcdReader, rx: Ucrx, _entity: readonly UcToken[]): void {
  ucrxNumber(reader, rx, Infinity);
}

export function ucdReadNegativeInfinity(
  reader: UcdReader,
  rx: Ucrx,
  _entity: readonly UcToken[],
): void {
  ucrxNumber(reader, rx, -Infinity);
}

export function ucdReadNaN(reader: UcdReader, rx: Ucrx, _entity: readonly UcToken[]): void {
  ucrxNumber(reader, rx, NaN);
}
