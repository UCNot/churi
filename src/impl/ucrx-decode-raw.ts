import { asis } from '@proc7ts/primitives';
import { UcrxReject, ucrxRejectSyntax } from '../rx/ucrx-rejection.js';
import { Ucrx } from '../rx/ucrx.js';
import { negate } from './numeric.js';

export function ucrxDecodeRaw(
  rx: Ucrx,
  input: string,
  reject: UcrxReject,
  decodeString: UcrxStringDecoder,
  decodePositive: UcrxStringDecoder,
  decodeNumeric: UcrxNumericDecoder,
): 0 | 1 {
  if (!input) {
    return decodeString(rx, '', reject);
  }

  const decoder = UCRX_VALUE_DECODERS[input[0]];

  return decoder
    ? decoder(rx, input, reject, decodeString, decodePositive, decodeNumeric)
    : decodeString(rx, input, reject);
}

type UcrxRawDecoder = (
  rx: Ucrx,
  input: string,
  reject: UcrxReject,
  decodeString: UcrxStringDecoder,
  decodePositive: UcrxStringDecoder,
  decodeNumeric: UcrxNumericDecoder,
) => 0 | 1;

type UcrxStringDecoder = (rx: Ucrx, value: string, reject: UcrxReject) => 0 | 1;

type UcrxNumericDecoder = (
  rx: Ucrx,
  input: string,
  reject: UcrxReject,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
) => 0 | 1;

const UCRX_VALUE_DECODERS: {
  readonly [prefix: string]: UcrxRawDecoder;
} = {
  '-': ucrxDecodeMinusSigned,
  0: ucrxDecodeZeroPrefixed,
  1: ucrxDecodeUnsigned,
  2: ucrxDecodeUnsigned,
  3: ucrxDecodeUnsigned,
  4: ucrxDecodeUnsigned,
  5: ucrxDecodeUnsigned,
  6: ucrxDecodeUnsigned,
  7: ucrxDecodeUnsigned,
  8: ucrxDecodeUnsigned,
  9: ucrxDecodeUnsigned,
};

function ucrxDecodeMinusSigned(
  rx: Ucrx,
  input: string,
  reject: UcrxReject,
  decodeString: UcrxStringDecoder,
  _decodePositive: UcrxStringDecoder,
  decodeNumeric: UcrxNumericDecoder,
): 0 | 1 {
  if (input.length < 3) {
    if (input.length < 2) {
      return rx.bol(false, reject);
    }
    if (input === '--') {
      return rx.nul(reject);
    }
  }

  const secondChar = input[1];

  if (secondChar >= '0' && secondChar <= '9') {
    return decodeNumeric(rx, input, reject, 1, negate);
  }

  return decodeString(rx, input, reject);
}

function ucrxDecodeZeroPrefixed(
  rx: Ucrx,
  input: string,
  reject: UcrxReject,
  _decodeString: UcrxStringDecoder,
  _decodePositive: UcrxStringDecoder,
  decodeNumeric: UcrxNumericDecoder,
): 0 | 1 {
  return decodeNumeric(rx, input, reject, 0, asis);
}

function ucrxDecodeUnsigned(
  rx: Ucrx,
  input: string,
  reject: UcrxReject,
  _decodeString: UcrxStringDecoder,
  decodePositive: UcrxStringDecoder,
  _decodeNumeric: UcrxNumericDecoder,
): 0 | 1 {
  return decodePositive(rx, input, reject);
}

export function ucrxDecodeString(rx: Ucrx, value: string, reject: UcrxReject): 0 | 1 {
  return rx.str(value, reject);
}

export function ucrxDecodePositive(rx: Ucrx, input: string, reject: UcrxReject): 0 | 1 {
  return rx.num(Number(input), reject);
}

export function ucrxDecodeNumeric(
  rx: Ucrx,
  input: string,
  reject: UcrxReject,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): 0 | 1 {
  if (input[offset + 1] === 'n') {
    let value: bigint;

    try {
      value = input.length < offset + 3 ? 0n : BigInt(input.slice(offset + 2));
    } catch (cause) {
      return reject(ucrxRejectSyntax('bigint', cause));
    }

    return rx.big(sign(value), reject);
  }

  const value = input.length < offset + 3 ? 0 : Number(input.slice(offset));

  if (Number.isFinite(value)) {
    return rx.num(sign(value), reject);
  }

  return reject(ucrxRejectSyntax('number', 'Not a number'));
}
