import { UcdReader } from '../../deserializer/ucd-reader.js';
import { UcdRx } from '../../deserializer/ucd-rx.js';
import { UcToken } from '../../syntax/uc-token.js';

export interface UcdEntityDef {
  readonly type?: undefined;
  readonly entity: string | readonly UcToken[];

  deserialize(reader: UcdReader, rx: UcdRx, token: readonly UcToken[]): void;
}
