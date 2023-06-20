import {
  UCS_APOSTROPHE,
  UCS_INFINITY_ENTITY,
  UCS_NAN_ENTITY,
  UCS_NEGATIVE_INFINITY_ENTITY,
} from './ucs-constants.js';
import { ucsWriteAsIs } from './ucs-write-asis.js';
import { UcsWriter } from './ucs-writer.js';

export async function ucsWriteNumber(writer: UcsWriter, value: number): Promise<void> {
  if (Number.isFinite(value)) {
    await ucsWriteAsIs(writer, value.toString());
  } else {
    await writer.ready;
    writer.write(
      Number.isNaN(value)
        ? UCS_NAN_ENTITY
        : value > 0
        ? UCS_INFINITY_ENTITY
        : UCS_NEGATIVE_INFINITY_ENTITY,
    );
  }
}

export async function ucsWriteNumberAsString(writer: UcsWriter, value: number): Promise<void> {
  await writer.ready;
  writer.write(UCS_APOSTROPHE);
  await ucsWriteAsIs(writer, value.toString());
}
