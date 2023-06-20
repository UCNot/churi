import { ucrxDecodeRaw, ucrxDecodeString } from '../impl/ucrx-decode-raw.js';
import { UcrxReject, ucrxRejectSyntax, ucrxRejectType } from '../rx/ucrx-rejection.js';
import { Ucrx } from '../rx/ucrx.js';

export function ucdDecodeBigInt(rx: Ucrx, input: string, reject: UcrxReject): 0 | 1 {
  return ucrxDecodeRaw(
    rx,
    input,
    reject,
    ucrxDecodeString,
    ucdDecodePositiveAsBigInt,
    ucdDecodeNumericAsBigInt,
  );
}

export function ucdParseBigInt(rx: Ucrx, input: string, reject: UcrxReject): 0 | 1 {
  return ucrxDecodeRaw(rx, input, reject, ucdRejectString, ucdRejectString, ucdParseBigIntNumeric);
}

export function ucdParseNumericAsBigInt(rx: Ucrx, input: string, reject: UcrxReject): 0 | 1 {
  return ucrxDecodeRaw(
    rx,
    input,
    reject,
    ucdRejectString,
    ucdDecodePositiveAsBigInt,
    ucdDecodeNumericAsBigInt,
  );
}

function ucdRejectString(rx: Ucrx, _value: string, reject: UcrxReject): 0 {
  return reject(ucrxRejectType('string', rx));
}

function ucdDecodePositiveAsBigInt(rx: Ucrx, input: string, reject: UcrxReject): 0 | 1 {
  let value: bigint;

  try {
    value = BigInt(input);
  } catch (cause) {
    return reject(ucrxRejectSyntax('bigint', cause));
  }

  return rx.big(value, reject);
}

function ucdParseBigIntNumeric(
  rx: Ucrx,
  input: string,
  reject: UcrxReject,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): 0 | 1 {
  return input[offset + 1] === 'n'
    ? ucdDecodeBigIntAtOffset(rx, input, reject, offset + 2, sign)
    : reject(ucrxRejectType('string', rx));
}

function ucdDecodeNumericAsBigInt(
  rx: Ucrx,
  input: string,
  reject: UcrxReject,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): 0 | 1 {
  return ucdDecodeBigIntAtOffset(
    rx,
    input,
    reject,
    input[offset + 1] === 'n' ? offset + 2 : offset,
    sign,
  );
}

function ucdDecodeBigIntAtOffset(
  rx: Ucrx,
  input: string,
  reject: UcrxReject,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): 0 | 1 {
  let value: bigint;

  try {
    value = input.length > offset ? BigInt(input.slice(offset)) : 0n;
  } catch (cause) {
    return reject(ucrxRejectSyntax('bigint', cause));
  }

  return rx.big(sign(value), reject);
}
