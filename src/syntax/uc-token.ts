// Line terminators.
export const UC_TOKEN_LF = 0x0a as const;
export const UC_TOKEN_CR = 0x0d as const;
export const UC_TOKEN_CRLF = 0x0a0d as const; // Windows-style

// Padding prefixes.
// Lowest byte is a code (space or tab), higher byte is the number of repeats.
export const UC_TOKEN_PREFIX_TAB = 0x09 as const;
export const UC_TOKEN_PREFIX_SPACE = 0x20 as const;

/**
 * _Inset_ starts with number token which lowest byte equals to this prefix. Tokens after this token considered
 * as _inset_ input chunks rather normal tokens. The _inset_ supposed to be processed by appropriate {@link UcLexer
 * lexer}. The token itself is used as _inset_ format identifier. The _inset_ input ends with {@link UC_TOKEN_INSET_END}
 * token. The _inset_ bounds themselves are control tokens to be ignored.
 *
 * _Inset_ expected at value position and nowhere else. E.g. it can't be inserted into the middle of a string.
 */
export const UC_TOKEN_PREFIX_INSET = 0x1f;

export const UC_TOKEN_INSET_URI_PARAM = 0x011f as const;
export const UC_TOKEN_INSET_END = UC_TOKEN_PREFIX_INSET;

// [Reserved characters](https://www.rfc-editor.org/rfc/rfc3986#section-2.2).
export const UC_TOKEN_EXCLAMATION_MARK = 0x21 as const;
export const UC_TOKEN_HASH = 0x23 as const;
export const UC_TOKEN_DOLLAR_SIGN = 0x24 as const;
export const UC_TOKEN_AMPERSAND = 0x26 as const;
export const UC_TOKEN_APOSTROPHE = 0x27 as const;
export const UC_TOKEN_OPENING_PARENTHESIS = 0x28 as const;
export const UC_TOKEN_CLOSING_PARENTHESIS = 0x29 as const;
export const UC_TOKEN_ASTERISK = 0x2a as const;
export const UC_TOKEN_PLUS_SIGN = 0x2b as const;
export const UC_TOKEN_COMMA = 0x2c as const;
export const UC_TOKEN_SLASH = 0x2f as const;
export const UC_TOKEN_COLON = 0x3a as const;
export const UC_TOKEN_SEMICOLON = 0x3b as const;
export const UC_TOKEN_EQUALS_SIGN = 0x3d as const;
export const UC_TOKEN_QUESTION_MARK = 0x3f as const;
export const UC_TOKEN_AT_SIGN = 0x40 as const;
export const UC_TOKEN_OPENING_BRACKET = 0x5b as const;
export const UC_TOKEN_CLOSING_BRACKET = 0x5d as const;

/**
 * URI charge token.
 *
 * Can be one of:
 *
 * - Non-empty [percent-decoded] string.
 *
 *   Subsequent string chunks allowed.
 *
 * - Number corresponding to one of [reserved characters] represented as one of `UC_TOKEN_` constants.
 *
 * - Number corresponding to one of the line terminators:
 *
 *    - {@link UC_TOKEN_LF},
 *    - {@link UC_TOKEN_CR},
 *    - {@link UC_TOKEN_CRLF}.
 *
 * - Number containing encoded padding.
 *
 *   Contains one of {@link UC_TOKEN_PREFIX_SPACE} or {@link UC_TOKEN_PREFIX_TAB} as the lowest byte, and a number of
 *   repeats (excluding the symbol itself) as the higher byte. At most 255 repeats corresponding to 256 chars.
 *
 *   Such padding always emitted for spaces and tabs around [reserved characters], line terminators, after input
 *   beginning, and before input end. Spaces and tabs e.g. between words may be emitted as part of string tokens.
 *
 * - Contains {@link UC_TOKEN_PREFIX_INSET} as the lowest byte. The tokens after this token considered an _inset_
 *   input chunks to be processed by appropriate {@link UcLexer lexer}. The token itself is used as _inset_ format
 *   identifier. The _inset_ input ends with {@link UC_TOKEN_INSET_END} token.
 *
 * [percent-decoded]: https://www.rfc-editor.org/rfc/rfc3986#section-2.1
 * [reserved characters]: https://www.rfc-editor.org/rfc/rfc3986#section-2.2
 */
export type UcToken = string | number;
