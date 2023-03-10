import { Ucrx } from '../rx/ucrx.js';
import { UcToken } from '../syntax/uc-token.js';
import { UcdReader } from './ucd-reader.js';

export type UcdEntityHandler = (reader: UcdReader, rx: Ucrx, entity: readonly UcToken[]) => void;

export type UcdEntityPrefixHandler = (
  reader: UcdReader,
  rx: Ucrx,
  prefix: readonly UcToken[],
  args: readonly UcToken[],
) => void;
