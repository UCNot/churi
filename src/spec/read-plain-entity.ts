import { UcdReader } from '../deserializer/ucd-reader.js';
import { ucrxString } from '../rx/ucrx-value.js';
import { Ucrx } from '../rx/ucrx.js';
import { printUcTokens } from '../syntax/print-uc-token.js';
import { UcToken } from '../syntax/uc-token.js';

export function readPlainEntity(
  reader: UcdReader,
  rx: Ucrx,
  prefix: readonly UcToken[],
  args: readonly UcToken[],
): void {
  ucrxString(reader, rx, printUcTokens([...prefix, ...args]));
}
