import { URIChargeRx } from '../uri-charge-rx.js';
import { URIChargeExtParser } from './uri-charge-ext-parser.js';

export interface ChURIValueDecoder {
  decodeKey(rawKey: string): string;
  decodeString(rawString: string): string;
  decodeValue<TValue, TCharge>(
    rx: URIChargeRx.ValueRx<TValue, TCharge>,
    ext: URIChargeExtParser<TValue, TCharge>,
    input: string,
  ): TCharge;
}

export const defaultChURIValueDecoder: ChURIValueDecoder = {
  decodeKey: decodeChURIKey,
  decodeString: decodeURIComponent,
  decodeValue: decodeChURIValue,
};

function decodeChURIKey(rawKey: string): string {
  return decodeURIComponent(rawKey.startsWith("'") ? rawKey.slice(1) : rawKey);
}

function decodeChURIValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): TCharge {
  if (!input) {
    // Empty string treated as is.
    return rx.setValue('', 'string');
  }

  const decoder = CHURI_VALUE_DECODERS[input[0]];

  if (decoder) {
    return decoder(rx, ext, input);
  }

  return decodeStringChURIValue(rx, input);
}

export type ChURIValuePrefix =
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

const CHURI_VALUE_DECODERS: {
  readonly [prefix: string]: <TValue, TCharge>(
    rx: URIChargeRx.ValueRx<TValue, TCharge>,
    ext: URIChargeExtParser<TValue, TCharge>,
    input: string,
  ) => TCharge;
} = {
  '!': decodeExclamationPrefixedChURIValue,
  "'": decodeQuotedChURIValue,
  '-': decodeMinusSignedChURIValue,
  0: decodeUnsignedChURIValue,
  1: decodeNumberChURIValue,
  2: decodeNumberChURIValue,
  3: decodeNumberChURIValue,
  4: decodeNumberChURIValue,
  5: decodeNumberChURIValue,
  6: decodeNumberChURIValue,
  7: decodeNumberChURIValue,
  8: decodeNumberChURIValue,
  9: decodeNumberChURIValue,
} satisfies { readonly [prefix in ChURIValuePrefix]: unknown };

function decodeExclamationPrefixedChURIValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): TCharge {
  if (input.length === 1) {
    return rx.setValue(true, 'boolean');
  }
  if (input === '!!') {
    return rx.rxList(rx => rx.endList());
  }

  return ext.addEntity(rx, input);
}

function decodeMinusSignedChURIValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  _ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): TCharge {
  if (input.length === 1) {
    return rx.setValue(false, 'boolean');
  }
  if (input === '--') {
    return rx.setValue(null, 'null');
  }

  const secondChar = input[1];

  if (secondChar >= '0' && secondChar <= '9') {
    return decodeNumericChURIValue(rx, input, 1, negate);
  }

  return decodeStringChURIValue(rx, input);
}

function decodeNumberChURIValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  _ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): TCharge {
  return rx.setValue(Number(input), 'number');
}

function decodeQuotedChURIValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  _ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): TCharge {
  return rx.setValue(decodeURIComponent(input.slice(1)), 'string');
}

function decodeStringChURIValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  input: string,
): TCharge {
  return rx.setValue(decodeURIComponent(input), 'string');
}

function decodeUnsignedChURIValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  _ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): TCharge {
  return decodeNumericChURIValue(rx, input, 0, asis);
}

function negate<T extends number | bigint>(value: T): T {
  return -value as T;
}

function asis<T extends number | bigint>(value: T): T {
  return value;
}

function decodeNumericChURIValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  input: string,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): TCharge {
  if (input[offset + 1] === 'n') {
    return rx.setValue(
      sign(input.length < offset + 3 ? 0n : BigInt(input.slice(offset + 2))),
      'bigint',
    );
  }

  return rx.setValue(sign(input.length < offset + 3 ? 0 : Number(input.slice(offset))), 'number');
}
