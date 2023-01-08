import { encodeUcsString } from '../impl/encode-ucs-string.js';
import { UCS_APOSTROPHE } from './ucs-constants.js';
import { UcsWriter } from './ucs-writer.js';
import { writeUcAsIs } from './write-uc-asis.js';

export async function writeUcString(ucsWriter: UcsWriter, value: string): Promise<void> {
  // Always prefix with apostrophe to prevent special whitespace treatment.
  await ucsWriter.ready;
  ucsWriter.write(UCS_APOSTROPHE);

  if (value) {
    await writeUcAsIs(ucsWriter, encodeUcsString(value));
  }
}
