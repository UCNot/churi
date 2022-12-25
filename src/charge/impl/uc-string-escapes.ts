export function escapeUcValue(encoded: string): string {
  return escapeUcString(encoded);
}

export function escapeUcKey(encoded: string): string {
  return encoded ? escapeUcString(encoded) : "'";
}

const UC_MIN_ESCAPED = 0x21; /* ! */
const UC_MAX_ESCAPED = 0x39; /* 9 */
const UC_ESCAPED: string[] = ['!', "'", '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const UC_ESCAPE_MASK = UC_ESCAPED.reduce(
  (mask, char) => mask | (1 << (char.charCodeAt(0) - UC_MIN_ESCAPED)),
  0,
);

function escapeUcString(encoded: string): string {
  const escaped = escapeUcSpecials(encoded);
  const firstChar = escaped.charCodeAt(0);

  return firstChar <= UC_MAX_ESCAPED
    && firstChar >= UC_MIN_ESCAPED
    && (1 << (firstChar - UC_MIN_ESCAPED)) & UC_ESCAPE_MASK
    ? `'${escaped}`
    : escaped;
}

const UC_SPECIALS_PATTERN = /*#__PURE__*/ /[()]/g;
const UC_SPECIALS_MAP: { readonly [char: string]: string } = {
  '(': '%28',
  ')': '%29',
};

export function escapeUcSpecials(encoded: string): string {
  return encoded.replace(UC_SPECIALS_PATTERN, special => UC_SPECIALS_MAP[special]);
}
