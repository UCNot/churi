import { ASCIICharSet } from './ascii-char-set.js';

const UC_ESCAPED = /*#__PURE__*/ new ASCIICharSet('-0123456789');

export function isEscapedUcString(value: string, escaped = UC_ESCAPED): boolean {
  if (escaped.prefixes(value)) {
    if (value.startsWith('-')) {
      if (value.length < 2 || value === '--') {
        return true;
      }

      const secondChar = value.charCodeAt(1);

      // Negative number.
      return secondChar < 0x40 && secondChar > 0x2f;
    }

    return true;
  }

  return false;
}

export const UC_KEY_ESCAPED = /*#__PURE__*/ new ASCIICharSet("!$'");

export function prefixUcKey(escaped: string): string {
  return escaped ? (UC_KEY_ESCAPED.prefixes(escaped) ? `$${escaped}` : escaped) : '$';
}
