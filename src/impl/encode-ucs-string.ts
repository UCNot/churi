/**
 * URL-encode special symbols for the use within `application/uri-charge`.
 */
export function encodeUcsString(value: string): string {
  return value.replace(
    UCS_STRING_ENCODE_PATTERN,
    char => UCS_STRING_ENCODE_LIST[char.charCodeAt(0)],
  );
}

// eslint-disable-next-line no-control-regex
const UCS_STRING_ENCODE_PATTERN = /[\x00-\x08\x0b\x0c\x0e-\x1f%(),]/g;
const UCS_STRING_ENCODE_LIST = /*#__PURE__*/ new Array(','.charCodeAt(0) + 1)
  .fill(' ')
  .map((_char, index) => '%' + index.toString(16).padStart(2, '0').toUpperCase());
