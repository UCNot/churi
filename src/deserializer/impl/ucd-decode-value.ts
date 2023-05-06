import { asis } from '@proc7ts/primitives';
import { negate } from '../../impl/numeric.js';
import { UcrxReject } from '../../rx/ucrx-rejection.js';
import { Ucrx } from '../../rx/ucrx.js';

export function ucdDecodeValue(rx: Ucrx, input: string, reject: UcrxReject): void {
  if (!input) {
    // Empty string treated as is.
    rx.str('', reject);
  } else {
    const decoder = UCD_VALUE_DECODERS[input[0]];

    if (decoder) {
      decoder(rx, input, reject);
    } else {
      rx.str(input, reject);
    }
  }
}

type UcdValueDecoder = (rx: Ucrx, input: string, reject: UcrxReject) => void;

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

function ucdDecodeMinusSigned(rx: Ucrx, input: string, reject: UcrxReject): void {
  if (input.length === 1) {
    rx.bol(false, reject);
  } else if (input === '--') {
    rx.nul(reject);
  } else {
    const secondChar = input[1];

    if (secondChar >= '0' && secondChar <= '9') {
      ucdDecodeNumeric(rx, input, reject, 1, negate);
    } else {
      rx.str(input, reject);
    }
  }
}

function ucdDecodeNumber(rx: Ucrx, input: string, reject: UcrxReject): void {
  rx.num(Number(input), reject);
}

function ucdDecodeUnsigned(rx: Ucrx, input: string, reject: UcrxReject): void {
  ucdDecodeNumeric(rx, input, reject, 0, asis);
}

function ucdDecodeNumeric(
  rx: Ucrx,
  input: string,
  reject: UcrxReject,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): void {
  if (input[offset + 1] === 'n') {
    let value: bigint;

    try {
      value = input.length < offset + 3 ? 0n : BigInt(input.slice(offset + 2));
    } catch (cause) {
      reject({
        code: 'invalidSyntax',
        details: { type: 'bigint' },
        message: (cause as Error).message,
        cause,
      });

      return;
    }

    rx.big(sign(value), reject);
  } else {
    const value = input.length < offset + 3 ? 0 : Number(input.slice(offset));

    if (Number.isFinite(value)) {
      rx.num(sign(value), reject);
    } else {
      reject({
        code: 'invalidSyntax',
        details: { type: 'number' },
        message: 'Not a number',
      });
    }
  }
}
