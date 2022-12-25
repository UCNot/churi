import { UcMap } from '../schema/uc-map.js';
import {
  escapeUcKey,
  escapeUcSpecials as encodeUcSpecials,
  escapeUcValue,
} from './impl/uc-string-escapes.js';
import { ANY_CHARGE_PLACEMENT, OPAQUE_CHARGE_PLACEMENT } from './impl/uri-chargeable.placement.js';
import { URIChargeable } from './uri-chargeable.js';

/**
 * Encodes arbitrary value to be placed to URI charge string.
 *
 * Handles primitive values, {@link URIChargeable URI charge-encodable} values, as well as arbitrary
 * {@link UcList arrays} and {@link UcMap object literals}.
 *
 * @param value - The value to encode.
 * @param placement - The supposed placement of encoded value. {@link URIChargeable.Any Any by default}.
 *
 * @returns Either encoded value, or `undefined` if the value can not be encoded.
 */
export function chargeURI(
  value: unknown,
  placement: URIChargeable.Placement = ANY_CHARGE_PLACEMENT,
): string | undefined {
  return URI_CHARGE_ENCODERS[typeof value]?.(value, placement);
}

/**
 * Encodes arbitrary value to be placed to URI charge string as argument(s). E.g. appended to {@link UcRoute#charge
 * path fragment}.
 *
 * @param value - The value to encode.
 * @param opaque - Whether a charge expected to be {@link URIChargeable.Arg#opaque opaque}.
 *
 * @returns Either encoded value, or `undefined` if the value can not be encoded.
 *
 * @see {@link chargeURI}.
 */
export function chargeURIArgs(value: unknown, opaque?: boolean): string | undefined {
  let omitParentheses = false;
  const encoded = chargeURI(value, {
    as: 'arg',
    opaque,
    omitParentheses() {
      omitParentheses = true;
    },
  });

  if (encoded === undefined) {
    return;
  }

  return omitParentheses ? encoded : `(${encoded})`;
}

const URI_CHARGE_ENCODERS: {
  readonly [type in string]: (value: any, placement: URIChargeable.Placement) => string | undefined;
} = {
  bigint: (value: bigint) => (value < 0n ? `-0n${-value}` : `0n${value}`),
  boolean: (value: boolean) => (value ? '!' : '-'),
  function: chargeURIFunction,
  number: chargeURINumber,
  object: chargeURIObject,
  string: chargeURIString,
  undefined: () => undefined,
};

/**
 * Encodes key of URI charge map entry.
 *
 * @param key - Entry key to encode.
 * @param placement - The supposed placement of encoded key.
 *
 * @returns Encoded key.
 */
export function chargeURIKey(key: string): string {
  return escapeUcKey(encodeURIComponent(key));
}

/**
 * Decodes key of URI charge map entry.
 *
 * @param encoded - Percent-encoded and possibly escaped key.
 *
 * @returns Decoded key.
 */
export function unchargeURIKey(encoded: string): string {
  return decodeURIComponent(encoded.startsWith("'") ? encoded.slice(1) : encoded);
}

/**
 * Encodes URI charge string value.
 *
 * @param key - Entry key to encode.
 * @param placement - The supposed placement of encoded string. {@link URIChargeable.Top Top-level by default}.
 *
 * @returns Encoded string.
 */
export function chargeURIString(value: string, placement?: URIChargeable.Placement): string {
  const encoded = encodeURIComponent(value);

  return encoded && (placement?.opaque ? encodeUcSpecials(encoded) : escapeUcValue(encoded));
}

function chargeURINumber(value: number): string {
  if (Number.isFinite(value)) {
    return value.toString();
  }
  if (Number.isNaN(value)) {
    return '!NaN';
  }

  return value > 0 ? '!Infinity' : '!-Infinity';
}

function chargeURIFunction(
  value: URIChargeable,
  placement: URIChargeable.Placement,
): string | undefined {
  if (typeof value.chargeURI === 'function') {
    return value.chargeURI(placement);
  }
  if (typeof value.toJSON === 'function') {
    return chargeURI(value.toJSON(), placement);
  }

  return;
}

function chargeURIObject(
  value: URIChargeable,
  placement: URIChargeable.Placement,
): string | undefined {
  if (!value) {
    // null
    return '--';
  }
  if (typeof value.chargeURI === 'function') {
    return value.chargeURI(placement);
  }
  if (typeof value.toJSON === 'function') {
    return chargeURI(value.toJSON(), placement);
  }
  if (Array.isArray(value)) {
    return chargeURIArray(value, placement);
  }

  const entries = Object.entries(value);

  return chargeURIMap(entries, entries.length, placement);
}

/** @internal */
export function chargeURIArray(
  list: unknown[],
  { as, omitParentheses, opaque }: URIChargeable.Placement,
): string {
  if (list.length < 2) {
    if (!list.length) {
      return '!!';
    }

    return chargeURIArrayItem(list[0], ANY_CHARGE_PLACEMENT);
  }

  let tailIndex: number;
  let itemPlacement: URIChargeable.Any = ANY_CHARGE_PLACEMENT;

  if (as === 'entry') {
    tailIndex = -1;
    omitParentheses();
  } else if (as === 'arg') {
    tailIndex = list.length - 1;
    if (opaque) {
      itemPlacement = OPAQUE_CHARGE_PLACEMENT;
    }
    omitParentheses();
  } else {
    tailIndex = list.length - 1;
  }

  return list.reduce(
    (prev: string, item: unknown, index: number) => prev
      + (index === tailIndex
        ? chargeURIArrayTail(item, itemPlacement.opaque)
        : chargeURIArrayItem(item, itemPlacement)),
    '',
  );
}

function chargeURIArrayItem(item: unknown, placement: URIChargeable.Any): string {
  const encoded = chargeURI(item, placement);

  return encoded != null ? `(${encoded})` : '(--)';
}

function chargeURIArrayTail(item: unknown, opaque?: boolean): string {
  let omitParentheses = false;
  const encoded = chargeURI(item, {
    as: 'tail',
    opaque,
    omitParentheses: () => {
      omitParentheses = true;
    },
  });

  if (omitParentheses) {
    return encoded!;
  }

  return encoded != null ? `(${encoded})` : '(--)';
}

/** @internal */
export function chargeURIMap(
  entries: Iterable<[string, unknown]>,
  numEntries: number,
  placement: URIChargeable.Placement,
): string {
  const isTail = placement.as === 'tail';
  const lastIndex = numEntries - 1;

  let omitParentheses: boolean;
  const entryPlacement: URIChargeable.Entry = {
    as: 'entry',
    opaque: undefined,
    omitParentheses() {
      omitParentheses = true;
    },
  };
  const encoded: string[] = [];
  let index = 0;

  for (const [key, value] of entries) {
    omitParentheses = false;

    const encodedValue = chargeURI(value, entryPlacement);

    if (encodedValue != null) {
      const encodedKey = chargeURIKey(key);

      if (!encodedValue && index === lastIndex && (encoded.length || isTail)) {
        // Suffix.
        encoded.push(encodedKey);
      } else {
        encoded.push(
          omitParentheses ? `${encodedKey}${encodedValue}` : `${encodedKey}(${encodedValue})`,
        );
      }

      ++index;
    }
  }

  if (!encoded.length) {
    // Empty map.
    return '!()';
  }
  if (isTail) {
    // Tail of the list.
    placement.omitParentheses();
  }

  return encoded.join('');
}
