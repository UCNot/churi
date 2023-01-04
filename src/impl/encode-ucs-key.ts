import { encodeUcsString } from './encode-ucs-string.js';
import { escapeUcKey } from './uc-string-escapes.js';

/**
 * URL-encode special symbols for the use as entry key within `application/uri-charge`.
 */
export function encodeUcsKey(key: string, subsequent = false): string {
  return key ? escapeUcKey(encodeUcsString(key), subsequent) : '$';
}
