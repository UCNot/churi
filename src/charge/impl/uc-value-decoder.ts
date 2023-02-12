import { asis } from '@proc7ts/primitives';
import { negate } from '../../impl/numeric.js';
import { unchargeURIKey } from '../charge-uri.js';
import { URIChargeRx } from '../uri-charge-rx.js';

export function decodeUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  input: string,
): void {
  if (!input) {
    // Empty string treated as is.
    rx.addValue('', 'string');
  } else {
    const decoder = UC_VALUE_DECODERS[input[0]];

    if (decoder) {
      decoder(rx, input);
    } else {
      const decoded = decodeURIComponent(input);
      const decoder = UC_STRING_DECODERS[decoded[0]];

      if (decoder) {
        decoder(rx, decoded);
      } else {
        rx.addValue(decoded, 'string');
      }
    }
  }
}

type UcValueDecoder = <TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  input: string,
) => void;

const UC_STRING_DECODERS: {
  readonly [prefix: string]: UcValueDecoder;
} = {
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
};

const UC_VALUE_DECODERS: {
  readonly [prefix: string]: UcValueDecoder;
} = {
  $: decodeDollarPrefixedUcValue,
  ...UC_STRING_DECODERS,
};

function decodeDollarPrefixedUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  input: string,
): void {
  rx.rxMap(mapRx => {
    if (input.length > 1) {
      // `$` treated as empty object.
      mapRx.addSuffix(unchargeURIKey(input));
    }

    return mapRx.endMap();
  });
}

function decodeMinusSignedUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
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
  input: string,
): void {
  rx.addValue(Number(input), 'number');
}

function decodeStringUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  input: string,
): void {
  rx.addValue(decodeURIComponent(input), 'string');
}

function decodeUnsignedUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  input: string,
): void {
  decodeNumericUcValue(rx, input, 0, asis);
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
