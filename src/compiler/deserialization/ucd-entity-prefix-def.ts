import { UcdReader } from '../../deserializer/ucd-reader.js';
import { UcdRx } from '../../deserializer/ucd-rx.js';
import { UcToken } from '../../syntax/uc-token.js';

export interface UcdEntityPrefixDef {
  readonly type?: undefined;
  readonly entityPrefix: string | readonly UcToken[];

  deserialize(
    reader: UcdReader,
    rx: UcdRx,
    prefix: readonly UcToken[],
    args: readonly UcToken[],
  ): void;
}
