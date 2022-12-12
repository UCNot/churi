import { AnyURIChargeRx, URIChargeTarget } from './uri-charge-target.js';

export type ChURIValueDecoder = <TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
) => TCharge;

export function decodeChURIValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): TCharge {
  if (!input) {
    // Empty string treated as is.
    return to.setValue(rx, key, '', 'string');
  }

  const decoder = CHURI_VALUE_DECODERS[input[0]];

  if (decoder) {
    return decoder(to, rx, key, input);
  }

  return decodeStringChURIValue(to, rx, key, input);
}

export function decodeChURIDirectiveArg<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): TCharge {
  return decodeChURIValue(to, rx, key, input);
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
  readonly [prefix: string]: ChURIValueDecoder;
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
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): TCharge {
  if (input.length === 1) {
    return to.setValue(rx, key, true, 'boolean');
  }
  if (input === '!!') {
    return to.rxList(rx, key, listRx => listRx.endList());
  }

  return to.setEntity(rx, key, input);
}

function decodeMinusSignedChURIValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): TCharge {
  if (input.length === 1) {
    return to.setValue(rx, key, false, 'boolean');
  }
  if (input === '--') {
    return to.setValue(rx, key, null, 'null');
  }

  const secondChar = input[1];

  if (secondChar >= '0' && secondChar <= '9') {
    return decodeNumericChURIValue(to, rx, key, input, 1, negate);
  }

  return decodeStringChURIValue(to, rx, key, input);
}

function decodeNumberChURIValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): TCharge {
  return to.setValue(rx, key, Number(input), 'number');
}

function decodeQuotedChURIValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): TCharge {
  return to.setValue(rx, key, decodeURIComponent(input.slice(1)), 'string');
}

function decodeStringChURIValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): TCharge {
  return to.setValue(rx, key, decodeURIComponent(input), 'string');
}

function decodeUnsignedChURIValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): TCharge {
  return decodeNumericChURIValue(to, rx, key, input, 0, asis);
}

function negate<T extends number | bigint>(value: T): T {
  return -value as T;
}

function asis<T extends number | bigint>(value: T): T {
  return value;
}

function decodeNumericChURIValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): TCharge {
  if (input[offset + 1] === 'n') {
    return to.setValue(
      rx,
      key,
      sign(input.length < offset + 3 ? 0n : BigInt(input.slice(offset + 2))),
      'bigint',
    );
  }

  return to.setValue(
    rx,
    key,
    sign(input.length < offset + 3 ? 0 : Number(input.slice(offset))),
    'number',
  );
}
