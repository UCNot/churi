import { ASCIICharSet } from './ascii-char-set.js';

export function escapeUcValue(encoded: string): string {
  const escaped = escapeUcSpecials(encoded);

  return UC_ESCAPED.prefixes(escaped) ? `'${escaped}` : escaped;
}

export const UC_ESCAPED = /*#__PURE__*/ new ASCIICharSet("!$'-0123456789");

export const UC_KEY_ESCAPED = /*#__PURE__*/ new ASCIICharSet("!$'");

export function escapeUcKey(encoded: string): string {
  return prefixUcKey(escapeUcSpecials(encoded));
}

export function prefixUcKey(escaped: string): string {
  return UC_KEY_ESCAPED.prefixes(escaped) ? `$${escaped}` : escaped;
}

const UC_SPECIALS_PATTERN = /*#__PURE__*/ /[()]/g;
const UC_SPECIALS_MAP: { readonly [char: string]: string } = {
  '(': '%28',
  ')': '%29',
};

export function escapeUcSpecials(encoded: string): string {
  return encoded.replace(UC_SPECIALS_PATTERN, special => UC_SPECIALS_MAP[special]);
}
