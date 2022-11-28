import { asis } from '@proc7ts/primitives';
import { URIChargeTarget } from './uri-charge-target.js';

export function decodeURIChargeValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  if (!input) {
    // Empty string treated as empty object.
    return to.consumer.startObject().endObject();
  }

  const decoder = URI_CHARGE_DECODERS[input[0]];

  if (decoder) {
    return decoder(to, input);
  }

  return decodeStringURICharge(to, input);
}

const URI_CHARGE_DECODERS: {
  [firstChar: string]: <TValue, TCharge>(
    to: URIChargeTarget<TValue, TCharge>,
    input: string,
  ) => TCharge;
} = {
  '!': decodeExclamationPrefixedURICharge,
  '-': decodeMinusSignedURICharge,
  0: decodeUnsignedURICharge,
  1: decodeNumberURICharge,
  2: decodeNumberURICharge,
  3: decodeNumberURICharge,
  4: decodeNumberURICharge,
  5: decodeNumberURICharge,
  6: decodeNumberURICharge,
  7: decodeNumberURICharge,
  8: decodeNumberURICharge,
  9: decodeNumberURICharge,
  "'": decodeQuotedURICharge,
};

function decodeExclamationPrefixedURICharge<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  if (input.length === 1) {
    return to.consumer.set(true, 'boolean');
  }

  return to.formatParser.addEntity(to, input);
}

function decodeMinusSignedURICharge<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  if (input.length === 1) {
    return to.consumer.set(false, 'boolean');
  }
  if (input === '--') {
    return to.consumer.startArray().endArray();
  }

  const secondChar = input[1];

  if (secondChar >= '0' && secondChar <= '9') {
    return decodeNumericURICharge(to, input, 1, negate);
  }

  return decodeStringURICharge(to, input);
}

function decodeNumberURICharge<TValue, TCharge>(
  { consumer }: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  return consumer.set(Number(input), 'number');
}

function decodeQuotedURICharge<TValue, TCharge>(
  { consumer }: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  return consumer.set(decodeURIComponent(input.slice(1)), 'string');
}

function decodeStringURICharge<TValue, TCharge>(
  { consumer }: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  return consumer.set(decodeURIComponent(input), 'string');
}

function decodeUnsignedURICharge<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  return decodeNumericURICharge(to, input, 0, asis);
}

function negate<T extends number | bigint>(value: T): T {
  return -value as T;
}

function decodeNumericURICharge<TValue, TCharge>(
  { consumer }: URIChargeTarget<TValue, TCharge>,
  input: string,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): TCharge {
  if (input[offset + 1] === 'n') {
    return consumer.set(
      sign(input.length < offset + 3 ? 0n : BigInt(input.slice(offset + 2))),
      'bigint',
    );
  }

  return consumer.set(sign(input.length < offset + 3 ? 0 : Number(input.slice(offset))), 'number');
}
