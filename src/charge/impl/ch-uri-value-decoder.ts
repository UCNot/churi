import { asis } from '@proc7ts/primitives';
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
    // Empty string treated as empty map.
    return to.consumer.startMap().endMap();
  }

  const decoder = CHURI_VALUE_DECODERS[input[0]];

  if (decoder) {
    return decoder(to, input);
  }

  return decodeStringChURIValue(to, input);
}

const CHURI_VALUE_DECODERS: {
  [firstChar: string]: <TValue, TCharge>(
    to: URIChargeTarget<TValue, TCharge>,
    input: string,
  ) => TCharge;
} = {
  '!': decodeExclamationPrefixedChURIValue,
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
  "'": decodeQuotedChURIValue,
};

function decodeExclamationPrefixedChURIValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  if (input.length === 1) {
    return to.consumer.set(true, 'boolean');
  }
  if (input === '!!') {
    return to.consumer.startList().endList();
  }

  return to.ext.addEntity(to, input);
}

function decodeMinusSignedChURIValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  if (input.length === 1) {
    return to.consumer.set(false, 'boolean');
  }
  if (input === '--') {
    return to.consumer.set(null, 'null');
  }

  const secondChar = input[1];

  if (secondChar >= '0' && secondChar <= '9') {
    return decodeNumericChURIValue(to, input, 1, negate);
  }

  return decodeStringChURIValue(to, input);
}

function decodeNumberChURIValue<TValue, TCharge>(
  { consumer }: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  return consumer.set(Number(input), 'number');
}

function decodeQuotedChURIValue<TValue, TCharge>(
  { decoder, consumer }: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  return consumer.set(decoder.decodeString(input.slice(1)), 'string');
}

function decodeStringChURIValue<TValue, TCharge>(
  { decoder, consumer }: URIChargeTarget<TValue, TCharge>,
  input: string,
): TCharge {
  return consumer.set(decoder.decodeString(input), 'string');
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

function decodeNumericChURIValue<TValue, TCharge>(
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
