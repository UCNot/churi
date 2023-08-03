import { isEscapedUcsString } from '../impl/encode-ucs-string.js';
import { UCS_APOSTROPHE, UCS_ESCAPED_DOUBLE_HYPHEN } from './ucs-constants.js';
import { ucsWriteAsIs } from './ucs-write-asis.js';
import { UcsWriter } from './ucs-writer.js';

export async function ucsWriteString(
  writer: UcsWriter,
  value: string,
  asItem: boolean,
): Promise<void> {
  await writer.ready;
  if (!value) {
    if (asItem) {
      // Always escape empty list item.
      writer.write(UCS_APOSTROPHE);
    }

    return;
  }

  const encoded = writer.encodeURI(value);

  if (isEscapedUcsString(encoded)) {
    // Always needs to be escaped.
    writer.write(UCS_APOSTROPHE);
  }

  await ucsWriteAsIs(writer, encoded);
}

export async function ucsWriteRawString(
  writer: UcsWriter,
  value: string,
  asItem: boolean,
): Promise<void> {
  await writer.ready;
  if (!value) {
    if (asItem) {
      // Always escape empty list item.
      writer.write(UCS_APOSTROPHE);
    }

    return;
  }

  await ucsWriteAsIs(writer, writer.encodeURI(value));
}

export async function ucsWriteURIEncoded(writer: UcsWriter, value: string): Promise<void> {
  await writer.ready;
  await ucsWriteAsIs(writer, writer.encodeURI(value));
}

export async function ucsWriteNullableRawString(
  writer: UcsWriter,
  value: string,
  asItem: boolean,
): Promise<void> {
  await writer.ready;
  if (!value) {
    if (asItem) {
      // Always escape empty list item.
      writer.write(UCS_APOSTROPHE);
    }

    return;
  }
  if (value === '--') {
    writer.write(UCS_ESCAPED_DOUBLE_HYPHEN);

    return;
  }

  await ucsWriteAsIs(writer, writer.encodeURI(value));
}
