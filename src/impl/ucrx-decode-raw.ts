import { asis } from '@proc7ts/primitives';
import { UcrxContext } from '../rx/ucrx-context.js';
import { ucrxRejectSyntax } from '../rx/ucrx-rejection.js';
import { Ucrx } from '../rx/ucrx.js';
import { negate } from './numeric.js';

export function ucrxDecodeRaw(
  context: UcrxContext,
  rx: Ucrx,
  input: string,
  decodeString: UcrxStringDecoder,
  decodePositive: UcrxStringDecoder,
  decodeNumeric: UcrxNumericDecoder,
): 0 | 1 {
  if (!input) {
    return decodeString(context, rx, '');
  }

  const decoder = UCRX_VALUE_DECODERS[input[0]];

  return decoder
    ? decoder(context, rx, input, decodeString, decodePositive, decodeNumeric)
    : decodeString(context, rx, input);
}

type UcrxRawDecoder = (
  context: UcrxContext,
  rx: Ucrx,
  input: string,
  decodeString: UcrxStringDecoder,
  decodePositive: UcrxStringDecoder,
  decodeNumeric: UcrxNumericDecoder,
) => 0 | 1;

type UcrxStringDecoder = (context: UcrxContext, rx: Ucrx, value: string) => 0 | 1;

type UcrxNumericDecoder = (
  context: UcrxContext,
  rx: Ucrx,
  input: string,
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
  context: UcrxContext,
  rx: Ucrx,
  input: string,
  decodeString: UcrxStringDecoder,
  _decodePositive: UcrxStringDecoder,
  decodeNumeric: UcrxNumericDecoder,
): 0 | 1 {
  if (input.length < 3) {
    if (input.length < 2) {
      return rx.bol(false, context);
    }
    if (input === '--') {
      return rx.nul(context);
    }
  }

  const secondChar = input[1];

  if (secondChar >= '0' && secondChar <= '9') {
    return decodeNumeric(context, rx, input, 1, negate);
  }

  return decodeString(context, rx, input);
}

function ucrxDecodeZeroPrefixed(
  context: UcrxContext,
  rx: Ucrx,
  input: string,
  _decodeString: UcrxStringDecoder,
  _decodePositive: UcrxStringDecoder,
  decodeNumeric: UcrxNumericDecoder,
): 0 | 1 {
  return decodeNumeric(context, rx, input, 0, asis);
}

function ucrxDecodeUnsigned(
  context: UcrxContext,
  rx: Ucrx,
  input: string,
  _decodeString: UcrxStringDecoder,
  decodePositive: UcrxStringDecoder,
  _decodeNumeric: UcrxNumericDecoder,
): 0 | 1 {
  return decodePositive(context, rx, input);
}

export function ucrxDecodeString(context: UcrxContext, rx: Ucrx, value: string): 0 | 1 {
  return rx.str(value, context);
}

export function ucrxDecodePositive(context: UcrxContext, rx: Ucrx, input: string): 0 | 1 {
  return rx.num(Number(input), context);
}

export function ucrxDecodeNumeric(
  context: UcrxContext,
  rx: Ucrx,
  input: string,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): 0 | 1 {
  if (input[offset + 1] === 'n') {
    let value: bigint;

    try {
      value = input.length < offset + 3 ? 0n : BigInt(input.slice(offset + 2));
    } catch (cause) {
      return context.reject(ucrxRejectSyntax('bigint', cause));
    }

    return rx.big(sign(value), context);
  }

  const value = input.length < offset + 3 ? 0 : Number(input.slice(offset));

  if (Number.isFinite(value)) {
    return rx.num(sign(value), context);
  }

  return context.reject(ucrxRejectSyntax('number', 'Not a number'));
}
