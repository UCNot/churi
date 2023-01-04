import { encodeUcsString } from '../impl/encode-ucs-string.js';
import { UCS_APOSTROPHE } from './ucs-constants.js';
import { UcsWriter } from './ucs-writer.js';
import { writeUcAsIs } from './write-uc-asis.js';

export async function writeUcString(ucsWriter: UcsWriter, value: string): Promise<void> {
  if (!value) {
    return;
  }

  const encoded = encodeUcsString(value);

  // Always prefix with apostrophe to prevent special whitespace treatment.
  await ucsWriter.ready;
  ucsWriter.write(UCS_APOSTROPHE);

  await writeUcAsIs(ucsWriter, encoded);
}
