import { ASCIICharSet } from './ascii-char-set.js';

export const UC_ESCAPED = /*#__PURE__*/ new ASCIICharSet("!$'-0123456789");

export const UC_KEY_ESCAPED = /*#__PURE__*/ new ASCIICharSet("!$'");

export function prefixUcKey(escaped: string): string {
  return UC_KEY_ESCAPED.prefixes(escaped) ? `$${escaped}` : escaped;
}
