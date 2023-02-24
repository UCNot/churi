import { asis } from '@proc7ts/primitives';
import { negate } from '../../impl/numeric.js';
import { UcdReader } from '../ucd-reader.js';
import { UcdRx } from '../ucd-rx.js';
import { ucdUnexpectedTypeError } from './ucd-errors.js';

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
      ucdRxNumeric(reader, rx, input, 1, negate);
    } else {
      ucdRxString(reader, rx, input);
    }
  }
}

function ucdDecodeNumber(reader: UcdReader, rx: UcdRx, input: string): void {
  ucdRxNumber(reader, rx, Number(input));
}

function ucdDecodeUnsigned(reader: UcdReader, rx: UcdRx, input: string): void {
  ucdRxNumeric(reader, rx, input, 0, asis);
}

function ucdRxBigInt(reader: UcdReader, rx: UcdRx, value: bigint): void {
  if (!rx._.big?.(value) && !rx._.any?.(value)) {
    reader.error(ucdUnexpectedTypeError('bigint', rx));
  }
}

export function ucdRxBoolean(reader: UcdReader, rx: UcdRx, value: boolean): void {
  if (!rx._.bol?.(value) && !rx._.any?.(value)) {
    reader.error(ucdUnexpectedTypeError('boolean', rx));
  }
}

function ucdRxNull(reader: UcdReader, rx: UcdRx): void {
  if (!rx._.nul?.()) {
    reader.error(ucdUnexpectedTypeError('null', rx));
  }
}

function ucdRxNumber(reader: UcdReader, rx: UcdRx, value: number): void {
  if (!rx._.num?.(value) && !rx._.any?.(value)) {
    reader.error(ucdUnexpectedTypeError('number', rx));
  }
}

function ucdRxNumeric(
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

export function ucdRxString(reader: UcdReader, rx: UcdRx, value: string): void {
  if (!rx._.str?.(value) && !rx._.any?.(value)) {
    reader.error(ucdUnexpectedTypeError('string', rx));
  }
}
