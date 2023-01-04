import { encodeUcsString } from '../impl/encode-ucs-string.js';
import { UCS_APOSTROPHE } from './ucs-constants.js';
import { UcsWriter } from './ucs-writer.js';

export async function writeUcString(ucsWriter: UcsWriter, value: string): Promise<void> {
  if (!value) {
    return;
  }

  const { writer, memory, encoder } = ucsWriter;

  let encoded = encodeUcsString(value);

  // Always prefix with apostrophe to prevent special whitespace treatment.
  await writer.ready;

  ucsWriter.whenWritten(writer.write(UCS_APOSTROPHE));

  while (
    await memory.use(encoded.length, async buffer => {
      const { read } = encoder.encodeInto(encoded, buffer);

      await writer.ready;
      ucsWriter.whenWritten(writer.write(buffer));

      if (read! >= encoded.length) {
        return false;
      }

      encoded = encoded.slice(read);

      return true;
    })
  ) {
    /* noop */
  }
}
