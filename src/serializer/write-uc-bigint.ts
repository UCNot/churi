import { UCS_BIGINT_PREFIX, UCS_NEGATIVE_BIGINT_PREFIX } from './ucs-constants.js';
import { UcsWriter } from './ucs-writer.js';
import { writeUcAsIs } from './write-uc-asis.js';

export async function writeUcBigInt(writer: UcsWriter, value: bigint): Promise<void> {
  let string: string;

  await writer.ready;
  if (value < 0) {
    writer.write(UCS_NEGATIVE_BIGINT_PREFIX);
    string = (-value).toString();
  } else {
    writer.write(UCS_BIGINT_PREFIX);
    string = value.toString();
  }

  await writeUcAsIs(writer, string);
}
