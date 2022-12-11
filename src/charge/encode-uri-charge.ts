import { ChURIList, ChURIMap } from './ch-uri-value.js';
import {
  escapeURIChargeKey,
  escapeURIChargeTopLevelKey,
  escapeURIChargeTopLevelValue,
  escapeURIChargeValue,
} from './impl/escape-uri-charge-string.js';
import { URIChargeEncodable } from './uri-charge-encodable.js';

/**
 * Encodes arbitrary value to be placed to URI charge string.
 *
 * Handles primitive values, {@link URIChargeEncodable URI charge-encodable} values, as well as arbitrary
 * {@link ChURIList arrays} and {@link ChURIMap object literals}.
 *
 * @param value - The value to encode.
 * @param placement - The supposed placement of encoded value.
 *
 * @returns Either encoded value, or `undefined` if the value can not be encoded.
 */
export function encodeURICharge(
  value: unknown,
  placement: URIChargeEncodable.Placement = {},
): string | undefined {
  return URI_CHARGE_ENCODERS[typeof value]?.(value, placement);
}

const URI_CHARGE_ENCODERS: {
  readonly [type in string]: (
    value: any,
    placement: URIChargeEncodable.Placement,
  ) => string | undefined;
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
export function encodeURIChargeKey(key: string, placement?: URIChargeEncodable.Placement): string {
  const encoded = encodeURIComponent(key);

  return placement?.as === 'top'
    ? escapeURIChargeTopLevelKey(encoded)
    : escapeURIChargeKey(encoded);
}

/**
 * Encodes URI charge string value.
 *
 * @param key - Entry key to encode.
 * @param placement - The supposed placement of encoded string.
 *
 * @returns Encoded string.
 */
export function encodeURIChargeString(
  value: string,
  placement?: URIChargeEncodable.Placement,
): string {
  const encoded = encodeURIComponent(value);

  return placement?.as === 'top'
    ? escapeURIChargeTopLevelValue(encoded)
    : escapeURIChargeValue(encoded);
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
  value: URIChargeEncodable,
  placement: URIChargeEncodable.Placement,
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
  value: URIChargeEncodable,
  placement: URIChargeEncodable.Placement,
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
  if (isURIChargeMap(value)) {
    return encodeURIChargeMap(value, placement);
  }

  return encodeURICharge(JSON.parse(JSON.stringify(value)));
}

function encodeURIChargeList(list: unknown[], placement: URIChargeEncodable.Placement): string {
  if (list.length < 2) {
    if (!list.length) {
      return '!!';
    }

    return encodeURIChargeListItem(list[0]);
  }

  const isEntryValue = placement.as === 'entry';
  let tailIndex: number;

  if (isEntryValue) {
    tailIndex = -1;
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

function isURIChargeMap(value: object): value is ChURIMap {
  return !value.constructor || value.constructor === Object;
}

function encodeURIChargeMap(
  map: Record<string, unknown>,
  placement: URIChargeEncodable.Placement,
): string {
  const isTail = placement.as === 'tail';

  let omitParentheses: boolean;
  const entryPlacement: URIChargeEncodable.Entry = {
    as: 'entry',
    omitParentheses() {
      omitParentheses = true;
    },
  };
  let keyPlacement: URIChargeEncodable.Placement | undefined = placement;
  const encoded: string[] = [];

  Object.entries(map).forEach(([key, value], index, entries) => {
    omitParentheses = false;

    const encodedValue = encodeURICharge(value, entryPlacement);

    if (encodedValue != null) {
      const encodedKey = encodeURIChargeKey(key, keyPlacement);

      keyPlacement = undefined;

      if (!encodedValue && index === entries.length - 1 && (encoded.length || isTail)) {
        // Suffix.
        encoded.push(encodedKey);
      } else {
        encoded.push(
          omitParentheses ? `${encodedKey}${encodedValue}` : `${encodedKey}(${encodedValue})`,
        );
      }
    }
  });

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
