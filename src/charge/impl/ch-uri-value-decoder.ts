import { URIChargeTarget } from './uri-charge-target.js';

export interface ChURIValueDecoder {
  decodeKey(rawKey: string): string;
  decodeString(rawString: string): string;
  decodeValue<TValue, TCharge>(to: URIChargeTarget<TValue, TCharge>, input: string): TCharge;
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
  to: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  if (!input) {
    // Empty string treated as is.
    return to.rx.setValue('', 'string');
  }

  const decoder = CHURI_VALUE_DECODERS[input[0]];

  if (decoder) {
    return decoder(to, input);
  }

  return decodeStringChURIValue(to, input);
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
    to: URIChargeTarget<TValue, TCharge>,
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
  to: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  if (input.length === 1) {
    return to.rx.setValue(true, 'boolean');
  }
  if (input === '!!') {
    return to.rx.rxList(rx => rx.endList());
  }

  return to.ext.addEntity(to, input);
}

function decodeMinusSignedChURIValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  if (input.length === 1) {
    return to.rx.setValue(false, 'boolean');
  }
  if (input === '--') {
    return to.rx.setValue(null, 'null');
  }

  const secondChar = input[1];

  if (secondChar >= '0' && secondChar <= '9') {
    return decodeNumericChURIValue(to, input, 1, negate);
  }

  return decodeStringChURIValue(to, input);
}

function decodeNumberChURIValue<TValue, TCharge>(
  { rx }: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  return rx.setValue(Number(input), 'number');
}

function decodeQuotedChURIValue<TValue, TCharge>(
  { decoder, rx: rx }: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  return rx.setValue(decoder.decodeString(input.slice(1)), 'string');
}

function decodeStringChURIValue<TValue, TCharge>(
  { decoder, rx }: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  return rx.setValue(decoder.decodeString(input), 'string');
}

function decodeUnsignedChURIValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  return decodeNumericChURIValue(to, input, 0, asis);
}

function negate<T extends number | bigint>(value: T): T {
  return -value as T;
}

function asis<T extends number | bigint>(value: T): T {
  return value;
}

function decodeNumericChURIValue<TValue, TCharge>(
  { rx }: URIChargeTarget<TValue, TCharge>,
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
