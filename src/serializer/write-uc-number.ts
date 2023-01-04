import {
  UCS_INFINITY_ENTITY,
  UCS_NAN_ENTITY,
  UCS_NEGATIVE_INFINITY_ENTITY,
} from './ucs-constants.js';
import { UcsWriter } from './ucs-writer.js';
import { writeUcAsIs } from './write-uc-asis.js';

export async function writeUcNumber(writer: UcsWriter, value: number): Promise<void> {
  if (Number.isFinite(value)) {
    await writeUcAsIs(writer, value.toString());
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
