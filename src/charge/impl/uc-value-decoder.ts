import { AnyURIChargeRx, URIChargeTarget } from './uri-charge-target.js';

export type UcValueDecoder = <TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
) => void;

export function decodeUcValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): void {
  if (!input) {
    // Empty string treated as is.
    to.addValue(rx, key, '', 'string');
  } else {
    const decoder = UC_VALUE_DECODERS[input[0]];

    if (decoder) {
      decoder(to, rx, key, input);
    } else {
      decodeStringUcValue(to, rx, key, input);
    }
  }
}

export function decodeUcDirectiveArg<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): void {
  return to.addEntity(rx, key, input);
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
): void {
  if (input.length === 1) {
    to.addValue(rx, key, true, 'boolean');
  } else if (input === '!!') {
    to.rxList(rx, key, listRx => listRx.endList());
  } else {
    to.addEntity(rx, key, input);
  }
}

function decodeMinusSignedUcValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): void {
  if (input.length === 1) {
    to.addValue(rx, key, false, 'boolean');
  } else if (input === '--') {
    to.addValue(rx, key, null, 'null');
  } else {
    const secondChar = input[1];

    if (secondChar >= '0' && secondChar <= '9') {
      decodeNumericUcValue(to, rx, key, input, 1, negate);
    } else {
      decodeStringUcValue(to, rx, key, input);
    }
  }
}

function decodeNumberUcValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): void {
  to.addValue(rx, key, Number(input), 'number');
}

function decodeQuotedUcValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): void {
  to.addValue(rx, key, decodeURIComponent(input.slice(1)), 'string');
}

function decodeStringUcValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): void {
  to.addValue(rx, key, decodeURIComponent(input), 'string');
}

function decodeUnsignedUcValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  input: string,
): void {
  decodeNumericUcValue(to, rx, key, input, 0, asis);
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
): void {
  if (input[offset + 1] === 'n') {
    to.addValue(
      rx,
      key,
      sign(input.length < offset + 3 ? 0n : BigInt(input.slice(offset + 2))),
      'bigint',
    );
  } else {
    to.addValue(
      rx,
      key,
      sign(input.length < offset + 3 ? 0 : Number(input.slice(offset))),
      'number',
    );
  }
}
