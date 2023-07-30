import { encodeURIPart } from 'httongue';
import { encodeUcsString, isEscapedUcsString } from '../impl/encode-ucs-string.js';
import { UCS_APOSTROPHE, UCS_ESCAPED_DOUBLE_HYPHEN } from './ucs-constants.js';
import { ucsWriteAsIs } from './ucs-write-asis.js';
import { UcsWriter } from './ucs-writer.js';

export async function ucsWriteString(
  ucsWriter: UcsWriter,
  value: string,
  asItem: boolean,
): Promise<void> {
  await ucsWriter.ready;
  if (!value) {
    if (asItem) {
      // Always escape empty list item.
      ucsWriter.write(UCS_APOSTROPHE);
    }

    return;
  }

  if (isEscapedUcsString(value)) {
    // Always needs to be escaped.
    ucsWriter.write(UCS_APOSTROPHE);
  }

  await ucsWriteAsIs(ucsWriter, encodeUcsString(value));
}

export async function ucsWriteRawString(
  ucsWriter: UcsWriter,
  value: string,
  asItem: boolean,
): Promise<void> {
  await ucsWriter.ready;
  if (!value) {
    if (asItem) {
      // Always escape empty list item.
      ucsWriter.write(UCS_APOSTROPHE);
    }

    return;
  }

  await ucsWriteAsIs(ucsWriter, encodeUcsString(value));
}

export async function ucsWriteURIEncoded(ucsWriter: UcsWriter, value: string): Promise<void> {
  await ucsWriter.ready;
  await ucsWriteAsIs(ucsWriter, encodeURIPart(value));
}

export async function ucsWriteNullableRawString(
  ucsWriter: UcsWriter,
  value: string,
  asItem: boolean,
): Promise<void> {
  await ucsWriter.ready;
  if (!value) {
    if (asItem) {
      // Always escape empty list item.
      ucsWriter.write(UCS_APOSTROPHE);
    }

    return;
  }
  if (value === '--') {
    ucsWriter.write(UCS_ESCAPED_DOUBLE_HYPHEN);

    return;
  }

  await ucsWriteAsIs(ucsWriter, encodeUcsString(value));
}
