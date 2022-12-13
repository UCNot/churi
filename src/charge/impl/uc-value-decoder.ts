import { AnyURIChargeRx, URIChargeTarget } from './uri-charge-target.js';

export type UcValueDecoder = <TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
) => TCharge;

export function decodeUcValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): TCharge {
  if (!input) {
    // Empty string treated as is.
    return to.setValue(rx, key, '', 'string');
  }

  const decoder = UC_VALUE_DECODERS[input[0]];

  if (decoder) {
    return decoder(to, rx, key, input);
  }

  return decodeStringUcValue(to, rx, key, input);
}

export function decodeUcDirectiveArg<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): TCharge {
  return to.setEntity(rx, key, input);
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

function decodeMinusSignedUcValue<TValue, TCharge>(
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
    return decodeNumericUcValue(to, rx, key, input, 1, negate);
  }

  return decodeStringUcValue(to, rx, key, input);
}

function decodeNumberUcValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): TCharge {
  return to.setValue(rx, key, Number(input), 'number');
}

function decodeQuotedUcValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): TCharge {
  return to.setValue(rx, key, decodeURIComponent(input.slice(1)), 'string');
}

function decodeStringUcValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): TCharge {
  return to.setValue(rx, key, decodeURIComponent(input), 'string');
}

function decodeUnsignedUcValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): TCharge {
  return decodeNumericUcValue(to, rx, key, input, 0, asis);
}

function negate<T extends number | bigint>(value: T): T {
  return -value as T;
}

function asis<T extends number | bigint>(value: T): T {
  return value;
}

function decodeNumericUcValue<TValue, TCharge>(
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
