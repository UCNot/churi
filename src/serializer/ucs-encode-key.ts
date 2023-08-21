import { UCS_STRING_ENCODE_LIST } from '../impl/encode-ucs-string.js';
import { prefixUcKey } from '../impl/uc-string-escapes.js';

/**
 * URL-encodes and escapes special symbols for the use as entry key within `application/uri-charge`.
 */
export function ucsEncodeKey(key: string): string {
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
