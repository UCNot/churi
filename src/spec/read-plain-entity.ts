import { UcdReader } from '../deserializer/ucd-reader.js';
import { ucdRxString } from '../deserializer/ucd-rx-value.js';
import { UcdRx } from '../deserializer/ucd-rx.js';
import { printUcTokens } from '../syntax/print-uc-token.js';
import { UcToken } from '../syntax/uc-token.js';

export function readPlainEntity(
  reader: UcdReader,
  rx: UcdRx,
  prefix: readonly UcToken[],
  args: readonly UcToken[],
): void {
  ucdRxString(reader, rx, printUcTokens([...prefix, ...args]));
}
