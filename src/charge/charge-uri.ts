import { escapeUcKey, escapeUcValue } from '../impl/uc-string-escapes.js';
import { UcMap } from '../schema/uc-map.js';
import { ANY_CHARGE_PLACEMENT } from './impl/uri-chargeable.placement.js';
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
 * When initial key encoded (by default), it is escaped with `$` if its encoded length is more than 63 octets.
 *
 * @param key - Entry key to encode.
 * @param subsequent - Whether the key is subsequent. `false` by default, which means the key is initial.
 *
 * @returns Encoded key.
 */
export function chargeURIKey(key: string): string {
  return key ? escapeUcKey(encodeURIComponent(key)) : '$';
}

/**
 * Decodes key of URI charge map entry.
 *
 * @param encoded - Percent-encoded and possibly escaped key.
 *
 * @returns Decoded key.
 */
export function unchargeURIKey(encoded: string): string {
  return decodeURIComponent(encoded.startsWith('$') ? encoded.slice(1) : encoded);
}

/**
 * Encodes URI charge string value.
 *
 * @param key - Entry key to encode.
 *
 * @returns Encoded string.
 */
export function chargeURIString(value: string): string {
  const encoded = encodeURIComponent(value);

  return encoded && escapeUcValue(encoded);
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

  return chargeURIMap(entries, placement);
}

/** @internal */
export function chargeURIArray(
  list: unknown[],
  { as, omitCommaBefore, omitCommaAfter }: URIChargeable.Placement,
): string {
  omitCommaBefore?.();
  omitCommaAfter?.();

  let commaBefore = true;
  let commaAfter = true;

  const itemPlacement: URIChargeable.Item = {
    as: 'item',
    omitCommaBefore() {
      commaBefore = false;
    },
    omitCommaAfter() {
      commaAfter = false;
    },
  };

  if (list.length < 2) {
    if (list.length) {
      // Encode single item.
      let itemCharge = chargeURI(list[0], itemPlacement);

      if (itemCharge == null) {
        itemCharge = '--'; // Encode undefined item as `null`.
      } else if (!itemCharge) {
        itemCharge = "'";
      }

      return as === 'item'
        ? `(${itemCharge})`
        : commaBefore
        ? /* Add comma to convert to array */ `,${itemCharge}`
        : itemCharge;
    }

    // Encode empty list.
    return as === 'item' ? '()' : ',';
  }

  const lastIndex = list.length - 1;
  let listCharge = '';
  let commaRequired = false;

  list.forEach((item, index) => {
    commaBefore = true;
    commaAfter = true;

    let itemCharge = chargeURI(item, itemPlacement);

    if (itemCharge == null) {
      itemCharge = '--'; // Encode undefined item as `null`.
    } else if (!itemCharge && (!index || index === lastIndex)) {
      // Lading and trailing empty items has to be escaped.
      itemCharge = "'";
    }
    if (!index) {
      // Always omit comma before the first item.
      listCharge = itemCharge;
    } else {
      if (commaBefore || commaRequired) {
        listCharge += ',';
      }
      listCharge += itemCharge;
    }

    commaRequired = commaAfter;
  });

  return as === 'item' ? `(${listCharge})` : listCharge;
}

/** @internal */
export function chargeURIMap(
  entries: Iterable<[string, unknown]>,
  { omitCommaAfter }: URIChargeable.Placement,
): string {
  const mapCharge: string[] = [];
  let hasSuffix = false;

  for (const [key, value] of entries) {
    const entryCharge = chargeURI(value);

    if (entryCharge != null) {
      // Omit undefined entries.
      if (hasSuffix) {
        mapCharge.push('()');
        hasSuffix = false;
      }

      const encodedKey = chargeURIKey(key);

      if (entryCharge) {
        mapCharge.push(`${encodedKey}(${entryCharge})`);
      } else {
        // Suffix.
        mapCharge.push(encodedKey);
        hasSuffix = true;
      }
    }
  }

  if (!hasSuffix) {
    // Can not omit comma after suffix.
    omitCommaAfter?.();
  } else if (mapCharge.length === 1) {
    // Nothing but suffix.
    // Avoid escaping it twice.
    const [entryCharge] = mapCharge;

    return entryCharge.startsWith('$') ? entryCharge : `$${entryCharge}`;
  }

  // Empty map?
  return mapCharge.length ? mapCharge.join('') : '$';
}
