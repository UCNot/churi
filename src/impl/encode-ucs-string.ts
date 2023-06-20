import { ASCIICharSet } from './ascii-char-set.js';
import { isEscapedUcString, prefixUcKey } from './uc-string-escapes.js';

const UCS_ESCAPED = /*#__PURE__*/ new ASCIICharSet('\x09\x0a\x0d-0123456789');

export function isEscapedUcsString(value: string): boolean {
  return isEscapedUcString(value, UCS_ESCAPED);
}

/**
 * URL-encode special symbols for the use within `application/uri-charge`.
 */
export function encodeUcsString(value: string): string {
  return value.replace(
    UCS_STRING_ENCODE_PATTERN,
    char => UCS_STRING_ENCODE_LIST[char.charCodeAt(0)],
  );
}

/**
 * Encode all ASCII special chars except `\r`, `\n`, and `\t`.
 *
 * Encode symbols with special meaning as well. Do not encode spaces.
 *
 * Do not encode anything else. It is not needed within `application/uri-charge` content.
 */
// eslint-disable-next-line no-control-regex
const UCS_STRING_ENCODE_PATTERN = /[\x00-\x08\x0b\x0c\x0e-\x1f%(),]/g;

/**
 * URL-encode and escape special symbols for the use as entry key within `application/uri-charge`.
 */
export function encodeUcsKey(key: string): string {
  return prefixUcKey(
    key.replace(UCS_KEY_ENCODE_PATTERN, char => UCS_STRING_ENCODE_LIST[char.charCodeAt(0)]),
  );
}

/**
 * Encode all ASCII special chars including `\r`, `\n`, and `\t`.
 *
 * Encode symbols with special meaning as well. Do not encode spaces.
 *
 * Do not encode anything else. It is not needed within `application/uri-charge` content.
 */
// eslint-disable-next-line no-control-regex
const UCS_KEY_ENCODE_PATTERN = /[\x00-\x1f%(),]/g;

const UCS_STRING_ENCODE_LIST = /*#__PURE__*/ new Array(','.charCodeAt(0) + 1)
  .fill(null)
  .map((_char, index) => '%' + index.toString(16).padStart(2, '0').toUpperCase());
