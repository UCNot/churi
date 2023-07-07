import { ucrxDecodeRaw, ucrxDecodeString } from '../impl/ucrx-decode-raw.js';
import { UcrxContext } from '../rx/ucrx-context.js';
import { ucrxRejectSyntax, ucrxRejectType } from '../rx/ucrx-rejection.js';
import { Ucrx } from '../rx/ucrx.js';

export function ucdDecodeBigInt(context: UcrxContext, rx: Ucrx, input: string): 0 | 1 {
  return ucrxDecodeRaw(
    context,
    rx,
    input,
    ucrxDecodeString,
    ucdDecodePositiveAsBigInt,
    ucdDecodeNumericAsBigInt,
  );
}

export function ucdParseBigInt(context: UcrxContext, rx: Ucrx, input: string): 0 | 1 {
  return ucrxDecodeRaw(context, rx, input, ucdRejectString, ucdRejectString, ucdParseBigIntNumeric);
}

export function ucdParseNumericAsBigInt(context: UcrxContext, rx: Ucrx, input: string): 0 | 1 {
  return ucrxDecodeRaw(
    context,
    rx,
    input,
    ucdRejectString,
    ucdDecodePositiveAsBigInt,
    ucdDecodeNumericAsBigInt,
  );
}

function ucdRejectString(cx: UcrxContext, rx: Ucrx, _value: string): 0 {
  return cx.reject(ucrxRejectType('string', rx));
}

function ucdDecodePositiveAsBigInt(context: UcrxContext, rx: Ucrx, input: string): 0 | 1 {
  let value: bigint;

  try {
    value = BigInt(input);
  } catch (cause) {
    return context.reject(ucrxRejectSyntax('bigint', cause));
  }

  return rx.big(value, context);
}

function ucdParseBigIntNumeric(
  context: UcrxContext,
  rx: Ucrx,
  input: string,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): 0 | 1 {
  return input[offset + 1] === 'n'
    ? ucdDecodeBigIntAtOffset(context, rx, input, offset + 2, sign)
    : context.reject(ucrxRejectType('string', rx));
}

function ucdDecodeNumericAsBigInt(
  context: UcrxContext,
  rx: Ucrx,
  input: string,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): 0 | 1 {
  return ucdDecodeBigIntAtOffset(
    context,
    rx,
    input,
    input[offset + 1] === 'n' ? offset + 2 : offset,
    sign,
  );
}

function ucdDecodeBigIntAtOffset(
  context: UcrxContext,
  rx: Ucrx,
  input: string,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): 0 | 1 {
  let value: bigint;

  try {
    value = input.length > offset ? BigInt(input.slice(offset)) : 0n;
  } catch (cause) {
    return context.reject(ucrxRejectSyntax('bigint', cause));
  }

  return rx.big(sign(value), context);
}
