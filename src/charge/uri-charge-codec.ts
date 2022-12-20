import {
  escapeUcKey,
  escapeUcTopLevelKey,
  escapeUcTopLevelValue,
  escapeUcValue,
} from './impl/uc-string-escapes.js';
import { UcMap } from './uc-value.js';
import { URIChargeable } from './uri-chargeable.js';

/**
 * Encodes arbitrary value to be placed to URI charge string.
 *
 * Handles primitive values, {@link URIChargeable URI charge-encodable} values, as well as arbitrary
 * {@link UcList arrays} and {@link UcMap object literals}.
 *
 * @param value - The value to encode.
 * @param placement - The supposed placement of encoded value.
 *
 * @returns Either encoded value, or `undefined` if the value can not be encoded.
 */
export function encodeURICharge(
  value: unknown,
  placement: URIChargeable.Placement = {},
): string | undefined {
  return URI_CHARGE_ENCODERS[typeof value]?.(value, placement);
}

const URI_CHARGE_ENCODERS: {
  readonly [type in string]: (value: any, placement: URIChargeable.Placement) => string | undefined;
} = {
  bigint: (value: bigint) => (value < 0n ? `-0n${-value}` : `0n${value}`),
  boolean: (value: boolean) => (value ? '!' : '-'),
  function: encodeURIChargeFunction,
  number: encodeURIChargeNumber,
  object: encodeURIChargeObject,
  string: encodeURIChargeString,
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
export function encodeURIChargeKey(key: string, placement?: URIChargeable.Placement): string {
  const encoded = encodeURIComponent(key);

  return placement?.as === 'top' ? escapeUcTopLevelKey(encoded) : escapeUcKey(encoded);
}

/**
 * Decodes key of URI charge map entry.
 *
 * @param encoded - Percent-encoded and possibly escaped key.
 *
 * @returns Decoded key.
 */
export function decodeURIChargeKey(encoded: string): string {
  return decodeURIComponent(encoded.startsWith("'") ? encoded.slice(1) : encoded);
}

/**
 * Encodes URI charge string value.
 *
 * @param key - Entry key to encode.
 * @param placement - The supposed placement of encoded string.
 *
 * @returns Encoded string.
 */
export function encodeURIChargeString(value: string, placement?: URIChargeable.Placement): string {
  const encoded = encodeURIComponent(value);

  return placement?.as === 'top' ? escapeUcTopLevelValue(encoded) : escapeUcValue(encoded);
}

function encodeURIChargeNumber(value: number): string {
  if (Number.isFinite(value)) {
    return value.toString();
  }
  if (Number.isNaN(value)) {
    return '!NaN';
  }

  return value > 0 ? '!Infinity' : '!-Infinity';
}

function encodeURIChargeFunction(
  value: URIChargeable,
  placement: URIChargeable.Placement,
): string | undefined {
  if (typeof value.encodeURICharge === 'function') {
    return value.encodeURICharge(placement);
  }
  if (typeof value.toJSON === 'function') {
    return encodeURICharge(value.toJSON());
  }

  return;
}

function encodeURIChargeObject(
  value: URIChargeable,
  placement: URIChargeable.Placement,
): string | undefined {
  if (!value) {
    // null
    return '--';
  }
  if (typeof value.encodeURICharge === 'function') {
    return value.encodeURICharge(placement);
  }
  if (typeof value.toJSON === 'function') {
    return encodeURICharge(value.toJSON());
  }
  if (Array.isArray(value)) {
    return encodeURIChargeList(value, placement);
  }

  const entries = Object.entries(value);

  return encodeURIChargeMap(entries, entries.length, placement);
}

/** @internal */
export function encodeURIChargeList(list: unknown[], placement: URIChargeable.Placement): string {
  if (list.length < 2) {
    if (!list.length) {
      return '!!';
    }

    return encodeURIChargeListItem(list[0]);
  }

  let tailIndex: number;

  if (placement.as === 'entry') {
    tailIndex = -1;
    placement.omitParentheses();
  } else if (placement.as === 'arg') {
    tailIndex = list.length - 1;
    placement.omitParentheses();
  } else {
    tailIndex = list.length - 1;
  }

  return list.reduce((prev: string, item: unknown, index: number) => {
    if (index === tailIndex) {
      return prev + encodeURIChargeListTail(item);
    }

    return prev + encodeURIChargeListItem(item);
  }, '');
}

function encodeURIChargeListItem(item: unknown): string {
  const encoded = encodeURICharge(item);

  return encoded != null ? `(${encoded})` : '(--)';
}

function encodeURIChargeListTail(item: unknown): string {
  let omitParentheses = false;
  const encoded = encodeURICharge(item, {
    as: 'tail',
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
export function encodeURIChargeMap(
  entries: Iterable<[string, unknown]>,
  numEntries: number,
  placement: URIChargeable.Placement,
): string {
  const isTail = placement.as === 'tail';
  const lastIndex = numEntries - 1;

  let omitParentheses: boolean;
  const entryPlacement: URIChargeable.Entry = {
    as: 'entry',
    omitParentheses() {
      omitParentheses = true;
    },
  };
  let keyPlacement: URIChargeable.Placement | undefined = placement;
  const encoded: string[] = [];
  let index = 0;

  for (const [key, value] of entries) {
    omitParentheses = false;

    const encodedValue = encodeURICharge(value, entryPlacement);

    if (encodedValue != null) {
      const encodedKey = encodeURIChargeKey(key, keyPlacement);

      keyPlacement = undefined;

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
