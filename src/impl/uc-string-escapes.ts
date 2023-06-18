import { ASCIICharSet } from './ascii-char-set.js';

const UC_ESCAPED = /*#__PURE__*/ new ASCIICharSet("!$'-0123456789");

export function isUcEscapedString(value: string): boolean | number {
  return UC_ESCAPED.prefixes(value);
}

const UC_RAW_ESCAPED = /*#__PURE__*/ new ASCIICharSet("!$'");

export function isUcEscapedRawString(value: string): boolean | number {
  return UC_RAW_ESCAPED.prefixes(value);
}

export const UC_KEY_ESCAPED = /*#__PURE__*/ new ASCIICharSet("!$'");

export function prefixUcKey(escaped: string): string {
  return UC_KEY_ESCAPED.prefixes(escaped) ? `$${escaped}` : escaped;
}
