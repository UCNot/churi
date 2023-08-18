export const UCS_APOSTROPHE = /*#__PURE__*/ new Uint8Array([0x27]); // `'`
export const UCS_ESCAPED_DOUBLE_HYPHEN = /*#__PURE__*/ new Uint8Array([0x27, 0x2d, 0x2d]); // `'--`
export const UCS_OPENING_PARENTHESIS = /*#__PURE__*/ new Uint8Array([0x28]); // `(`
export const UCS_CLOSING_PARENTHESIS = /*#__PURE__*/ new Uint8Array([0x29]); // `)`
export const UCS_COMMA = /*#__PURE__*/ new Uint8Array([0x2c]); // `,`
export const UCS_EMPTY_LIST = /*#__PURE__*/ new Uint8Array([0x28, 0x29]); // `()`
export const UCS_EMPTY_MAP = /*#__PURE__*/ new Uint8Array([0x24]); // `$`
export const UCS_EMPTY_ENTRY_PREFIX = /*#__PURE__*/ new Uint8Array([0x24, 0x28]); // `$(`
export const UCS_NULL = /*#__PURE__*/ new Uint8Array([0x2d, 0x2d]); // `--`
export const UCS_NULL_ENTRY_VALUE = /*#__PURE__*/ new Uint8Array([0x2d, 0x2d, 0x29]); // `--)`
export const UCS_NAN_ENTITY = /*#__PURE__*/ asciiToBin('!NaN');
export const UCS_INFINITY_ENTITY = /*#__PURE__*/ asciiToBin('!Infinity');
export const UCS_NEGATIVE_INFINITY_ENTITY = /*#__PURE__*/ asciiToBin('!-Infinity');
export const UCS_TRUE = /*#__PURE__*/ new Uint8Array([0x21]); // `!`
export const UCS_FALSE = /*#__PURE__*/ new Uint8Array([0x2d]); // `-`
export const UCS_BIGINT_PREFIX = /*#__PURE__*/ new Uint8Array([0x30, 0x6e]); // `0n`
export const UCS_NEGATIVE_BIGINT_PREFIX = /*#__PURE__*/ new Uint8Array([0x2d, 0x30, 0x6e]); // `-0n`

export const UCS_OPENING_BRACKET = /*#__PURE__*/ new Uint8Array([0x5b]); // `[`
export const UCS_CLOSING_BRACKET = /*#__PURE__*/ new Uint8Array([0x5d]); // `]`

export const UCS_JSON_NULL = /*#__PURE__*/ asciiToBin('null');
export const UCS_JSON_TRUE = /*#__PURE__*/ asciiToBin('true');
export const UCS_JSON_FALSE = /*#__PURE__*/ asciiToBin('false');
export const UCS_JSON_EMPTY_ARRAY = /*#__PURE__*/ new Uint8Array([0x5b, 0x5d]); // `[]`

function asciiToBin(value: string): Uint8Array {
  return new Uint8Array(value.split('').map(char => char.charCodeAt(0)));
}
