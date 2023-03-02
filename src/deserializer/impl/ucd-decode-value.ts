import { asis } from '@proc7ts/primitives';
import { negate } from '../../impl/numeric.js';
import { UcdReader } from '../ucd-reader.js';
import { ucdRxBigInt, ucdRxBoolean, ucdRxNull, ucdRxNumber, ucdRxString } from '../ucd-rx-value.js';
import { UcdRx } from '../ucd-rx.js';

export function ucdDecodeValue(reader: UcdReader, rx: UcdRx, input: string): void {
  if (!input) {
    // Empty string treated as is.
    ucdRxString(reader, rx, '');
  } else {
    const decoder = UCD_VALUE_DECODERS[input[0]];

    if (decoder) {
      decoder(reader, rx, input);
    } else {
      ucdRxString(reader, rx, input);
    }
  }
}

type UcdValueDecoder = (reader: UcdReader, rx: UcdRx, input: string) => void;

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

function ucdDecodeMinusSigned(reader: UcdReader, rx: UcdRx, input: string): void {
  if (input.length === 1) {
    ucdRxBoolean(reader, rx, false);
  } else if (input === '--') {
    ucdRxNull(reader, rx);
  } else {
    const secondChar = input[1];

    if (secondChar >= '0' && secondChar <= '9') {
      ucdDecodeNumeric(reader, rx, input, 1, negate);
    } else {
      ucdRxString(reader, rx, input);
    }
  }
}

function ucdDecodeNumber(reader: UcdReader, rx: UcdRx, input: string): void {
  ucdRxNumber(reader, rx, Number(input));
}

function ucdDecodeUnsigned(reader: UcdReader, rx: UcdRx, input: string): void {
  ucdDecodeNumeric(reader, rx, input, 0, asis);
}

function ucdDecodeNumeric(
  reader: UcdReader,
  rx: UcdRx,
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

    ucdRxBigInt(reader, rx, sign(value));
  } else {
    const value = input.length < offset + 3 ? 0 : Number(input.slice(offset));

    if (Number.isFinite(value)) {
      ucdRxNumber(reader, rx, sign(value));
    } else {
      reader.error({
        code: 'invalidSyntax',
        details: { type: 'number' },
        message: 'Not a number',
      });
    }
  }
}
