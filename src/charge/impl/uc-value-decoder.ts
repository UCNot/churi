import { URIChargeRx } from '../uri-charge-rx.js';
import { URIChargeExtParser } from './uri-charge-ext-parser.js';

export type UcValueDecoder = <TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
) => void;

export function decodeUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): void {
  if (!input) {
    // Empty string treated as is.
    rx.addValue('', 'string');
  } else {
    const decoder = UC_VALUE_DECODERS[input[0]];

    if (decoder) {
      decoder(rx, ext, input);
    } else {
      decodeStringUcValue(rx, input);
    }
  }
}

export function decodeUcDirectiveArg<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  _ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): void {
  return rx.addEntity(input);
}

export type UcValuePrefix =
  | '!'
  | "'"
  | '-'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9';

const UC_VALUE_DECODERS: {
  readonly [prefix: string]: UcValueDecoder;
} = {
  '!': decodeExclamationPrefixedUcValue,
  "'": decodeQuotedUcValue,
  '-': decodeMinusSignedUcValue,
  0: decodeUnsignedUcValue,
  1: decodeNumberUcValue,
  2: decodeNumberUcValue,
  3: decodeNumberUcValue,
  4: decodeNumberUcValue,
  5: decodeNumberUcValue,
  6: decodeNumberUcValue,
  7: decodeNumberUcValue,
  8: decodeNumberUcValue,
  9: decodeNumberUcValue,
} satisfies { readonly [prefix in UcValuePrefix]: unknown };

function decodeExclamationPrefixedUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): void {
  if (input.length === 1) {
    rx.addValue(true, 'boolean');
  } else if (input === '!!') {
    rx.rxList(listRx => listRx.end());
  } else {
    ext.parseEntity(rx, input);
  }
}

function decodeMinusSignedUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  _ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): void {
  if (input.length === 1) {
    rx.addValue(false, 'boolean');
  } else if (input === '--') {
    rx.addValue(null, 'null');
  } else {
    const secondChar = input[1];

    if (secondChar >= '0' && secondChar <= '9') {
      decodeNumericUcValue(rx, input, 1, negate);
    } else {
      decodeStringUcValue(rx, input);
    }
  }
}

function decodeNumberUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  _ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): void {
  rx.addValue(Number(input), 'number');
}

function decodeQuotedUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  _ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): void {
  rx.addValue(decodeURIComponent(input.slice(1)), 'string');
}

function decodeStringUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  input: string,
): void {
  rx.addValue(decodeURIComponent(input), 'string');
}

function decodeUnsignedUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  _ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): void {
  decodeNumericUcValue(rx, input, 0, asis);
}

function negate<T extends number | bigint>(value: T): T {
  return -value as T;
}

function asis<T extends number | bigint>(value: T): T {
  return value;
}

function decodeNumericUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  input: string,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): void {
  if (input[offset + 1] === 'n') {
    rx.addValue(sign(input.length < offset + 3 ? 0n : BigInt(input.slice(offset + 2))), 'bigint');
  } else {
    rx.addValue(sign(input.length < offset + 3 ? 0 : Number(input.slice(offset))), 'number');
  }
}
