/**
 * URL-encode special symbols for the use within `application/uri-charge`.
 */
export function encodeUcsString(value: string): string {
  return value.replace(UCS_STRING_ENCODE_PATTERN, char => UCS_STRING_ENCODE_MAP[char]);
}

const UCS_STRING_ENCODE_PATTERN = /[(),%]/g;
const UCS_STRING_ENCODE_MAP: { [char: string]: string } = {
  '%': '%25',
  '(': '%28',
  ')': '%29',
  ',': '%2C',
};
