import { UcsWriter } from './ucs-writer.js';

export async function ucsWriteAsIs(writer: UcsWriter, value: string): Promise<void> {
  const { memory, encoder } = writer;

  while (
    await memory.use(value.length, async buffer => {
      const { read } = encoder.encodeInto(value, buffer);

      await writer.ready;
      writer.write(buffer);
      await writer.written();

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
