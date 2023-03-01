import { UcToken } from '../syntax/uc-token.js';
import { UcdReader } from './ucd-reader.js';
import { UcdRx } from './ucd-rx.js';

export type UcdEntityHandler = (reader: UcdReader, rx: UcdRx, entity: readonly UcToken[]) => void;

export type UcdEntityPrefixHandler = (
  reader: UcdReader,
  rx: UcdRx,
  prefix: readonly UcToken[],
  args: readonly UcToken[],
) => void;
