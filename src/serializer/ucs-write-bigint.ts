import { UCS_BIGINT_PREFIX, UCS_NEGATIVE_BIGINT_PREFIX } from './ucs-constants.js';
import { ucsWriteAsIs } from './ucs-write-asis.js';
import { UcsWriter } from './ucs-writer.js';

export async function ucsWriteBigInt(writer: UcsWriter, value: bigint): Promise<void> {
  let string: string;

  await writer.ready;
  if (value < 0) {
    writer.write(UCS_NEGATIVE_BIGINT_PREFIX);
    string = (-value).toString();
  } else {
    writer.write(UCS_BIGINT_PREFIX);
    string = value.toString();
  }

  await ucsWriteAsIs(writer, string);
}
