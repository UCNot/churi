import { UcsWriter } from './ucs-writer.js';

export async function writeUcAsIs(ucsWriter: UcsWriter, value: string): Promise<void> {
  const { memory, encoder } = ucsWriter;

  while (
    await memory.use(value.length, async buffer => {
      const { read } = encoder.encodeInto(value, buffer);

      await ucsWriter.ready;
      ucsWriter.write(buffer);
      await ucsWriter.written();

      if (read! >= value.length) {
        return false;
      }

      value = value.slice(read);

      return true;
    })
  ) {
    /* noop */
  }
}
