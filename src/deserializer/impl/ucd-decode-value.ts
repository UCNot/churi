import { asis } from '@proc7ts/primitives';
import { negate } from '../../impl/numeric.js';
import { ucrxBigInt, ucrxBoolean, ucrxNull, ucrxNumber, ucrxString } from '../../rx/ucrx-value.js';
import { Ucrx } from '../../rx/ucrx.js';
import { UcdReader } from '../ucd-reader.js';

export function ucdDecodeValue(reader: UcdReader, rx: Ucrx, input: string): void {
  if (!input) {
    // Empty string treated as is.
    ucrxString(reader, rx, '');
  } else {
    const decoder = UCD_VALUE_DECODERS[input[0]];

    if (decoder) {
      decoder(reader, rx, input);
    } else {
      ucrxString(reader, rx, input);
    }
  }
}

type UcdValueDecoder = (reader: UcdReader, rx: Ucrx, input: string) => void;

const UCD_VALUE_DECODERS: {
  readonly [prefix: string]: UcdValueDecoder;
} = {
  '-': ucdDecodeMinusSigned,
  0: ucdDecodeUnsigned,
  1: ucdDecodeNumber,
  2: ucdDecodeNumber,
  3: ucdDecodeNumber,
  4: ucdDecodeNumber,
  5: ucdDecodeNumber,
  6: ucdDecodeNumber,
  7: ucdDecodeNumber,
  8: ucdDecodeNumber,
  9: ucdDecodeNumber,
};

function ucdDecodeMinusSigned(reader: UcdReader, rx: Ucrx, input: string): void {
  if (input.length === 1) {
    ucrxBoolean(reader, rx, false);
  } else if (input === '--') {
    ucrxNull(reader, rx);
  } else {
    const secondChar = input[1];

    if (secondChar >= '0' && secondChar <= '9') {
      ucdDecodeNumeric(reader, rx, input, 1, negate);
    } else {
      ucrxString(reader, rx, input);
    }
  }
}

function ucdDecodeNumber(reader: UcdReader, rx: Ucrx, input: string): void {
  ucrxNumber(reader, rx, Number(input));
}

function ucdDecodeUnsigned(reader: UcdReader, rx: Ucrx, input: string): void {
  ucdDecodeNumeric(reader, rx, input, 0, asis);
}

function ucdDecodeNumeric(
  reader: UcdReader,
  rx: Ucrx,
  input: string,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): void {
  if (input[offset + 1] === 'n') {
    let value: bigint;

    try {
      value = input.length < offset + 3 ? 0n : BigInt(input.slice(offset + 2));
    } catch (cause) {
      reader.error({
        code: 'invalidSyntax',
        details: { type: 'bigint' },
        message: (cause as Error).message,
        cause,
      });

      return;
    }

    ucrxBigInt(reader, rx, sign(value));
  } else {
    const value = input.length < offset + 3 ? 0 : Number(input.slice(offset));

    if (Number.isFinite(value)) {
      ucrxNumber(reader, rx, sign(value));
    } else {
      reader.error({
        code: 'invalidSyntax',
        details: { type: 'number' },
        message: 'Not a number',
      });
    }
  }
}
