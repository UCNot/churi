export const UCS_APOSTROPHE = /*#__PURE__*/ new Uint8Array([0x27]); // `'`
export const UCS_OPENING_PARENTHESIS = /*#__PURE__*/ new Uint8Array([0x28]); // `(`
export const UCS_CLOSING_PARENTHESIS = /*#__PURE__*/ new Uint8Array([0x29]); // `)`
export const UCS_LIST_ITEM_SEPARATOR = /*#__PURE__*/ new Uint8Array([0x29, 0x28]); // `)(`
export const UCS_EMPTY_LIST = /*#__PURE__*/ new Uint8Array([0x21, 0x21]); // `!!`
export const UCS_EMPTY_MAP = /*#__PURE__*/ new Uint8Array([0x24]); // `$`
export const UCS_NULL = /*#__PURE__*/ new Uint8Array([0x2d, 0x2d]); // `--`
export const UCS_NULL_ENTRY_VALUE = /*#__PURE__*/ new Uint8Array([0x2d, 0x2d, 0x29]); // `--)`
export const UCS_NAN_ENTITY = /*#__PURE__*/ asciiToBin('!NaN');
export const UCS_INFINITY_ENTITY = /*#__PURE__*/ asciiToBin('!Infinity');
export const UCS_NEGATIVE_INFINITY_ENTITY = /*#__PURE__*/ asciiToBin('!-Infinity');
export const UCS_TRUE = /*#__PURE__*/ new Uint8Array([0x21]); // `!`
export const UCS_FALSE = /*#__PURE__*/ new Uint8Array([0x2d]); // `-`
export const UCS_BIGINT_PREFIX = /*#__PURE__*/ new Uint8Array([0x30, 0x6e]); // `0n`
export const UCS_NEGATIVE_BIGINT_PREFIX = /*#__PURE__*/ new Uint8Array([0x2d, 0x30, 0x6e]); // `-0n`

function asciiToBin(value: string): Uint8Array {
  return new Uint8Array(value.split('').map(char => char.charCodeAt(0)));
}
