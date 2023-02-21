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
    const decoder = UC_RAW_DECODERS[input[0]];

    if (decoder) {
      decoder(rx, input);
    } else {
      const decoded = decodeURIComponent(input);
      const decoder = UC_VALUE_DECODERS[decoded[0]];

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

function createUcDecoders(): {
  UC_VALUE_DECODERS: {
    readonly [prefix: string]: UcValueDecoder;
  };
  UC_RAW_DECODERS: {
    readonly [prefix: string]: UcValueDecoder;
  };
} {
  const decoders: Record<string, UcValueDecoder> = {};
  const rawDecoders: Record<string, UcValueDecoder> = {
    $: decodeDollarPrefixedUcValue,
  };
  const addRawDecoder = (prefix: string | number, decoder: UcValueDecoder): void => {
    decoders[prefix] = decoder;
    rawDecoders[prefix] = (rx, input) => decoder(rx, decodeURIComponent(input));
  };

  addRawDecoder('-', decodeMinusSignedUcValue);
  addRawDecoder(0, decodeUnsignedUcValue);
  for (let i = 1; i < 10; ++i) {
    addRawDecoder(i, decodeNumberUcValue);
  }

  return {
    UC_VALUE_DECODERS: decoders,
    UC_RAW_DECODERS: rawDecoders,
  };
}

const { UC_VALUE_DECODERS, UC_RAW_DECODERS } = /*#__PURE__*/ createUcDecoders();

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
