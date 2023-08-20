import { UCS_BIGINT_PREFIX, UCS_NEGATIVE_BIGINT_PREFIX } from './ucs-constants.js';
import { ucsWriteAsIs } from './ucs-write-asis.js';
import { UcsWriter } from './ucs-writer.js';

export async function ucsWriteBigInt(writer: UcsWriter, value: bigint): Promise<void> {
  let string: string;

  await writer.ready;
  if (value < 0) {
    writer.write(UCS_NEGATIVE_BIGINT_PREFIX);
    string = (-value).toString();
  } else {
    writer.write(UCS_BIGINT_PREFIX);
    string = value.toString();
  }

  await ucsWriteAsIs(writer, string);
}

export async function ucsWriteBigIntJSON(writer: UcsWriter, value: bigint): Promise<void> {
  let string: string;

  if (value < 0) {
    string = `"-0n${-value}"`;
  } else {
    string = `"0n${value}"`;
  }

  await ucsWriteAsIs(writer, string);
}

const MIN_INTEGER = /*#__PURE__*/ BigInt(Number.MIN_SAFE_INTEGER);
const MAX_INTEGER = /*#__PURE__*/ BigInt(Number.MAX_SAFE_INTEGER);

export async function ucsWriteBigIntOrNumber(writer: UcsWriter, value: bigint): Promise<void> {
  let string: string;

  if (value < 0) {
    if (value < MIN_INTEGER) {
      await writer.ready;
      writer.write(UCS_NEGATIVE_BIGINT_PREFIX);
      string = (-value).toString();
    } else {
      string = value.toString();
    }
  } else {
    if (value > MAX_INTEGER) {
      await writer.ready;
      writer.write(UCS_BIGINT_PREFIX);
    }
    string = value.toString();
  }

  await ucsWriteAsIs(writer, string);
}

export async function ucsWriteBigIntOrNumberJSON(writer: UcsWriter, value: bigint): Promise<void> {
  await ucsWriteAsIs(
    writer,
    value < MIN_INTEGER || value > MAX_INTEGER ? `"${value}"` : value.toString(),
  );
}
