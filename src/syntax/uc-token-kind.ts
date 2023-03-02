import {
  UcToken,
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_COMMA,
  UC_TOKEN_CR,
  UC_TOKEN_LF,
  UC_TOKEN_OPENING_PARENTHESIS,
  UC_TOKEN_PREFIX_SPACE,
  UC_TOKEN_PREFIX_TAB,
} from './uc-token.js';

export const UC_TOKEN_KIND_STRING = 0 as const;

export const UC_TOKEN_KIND_PADDING = 1 as const;
export const UC_TOKEN_KIND_NL = 2 as const;
export const UC_TOKEN_KIND_IS_WHITESPACE = UC_TOKEN_KIND_PADDING | UC_TOKEN_KIND_NL;

export const UC_TOKEN_KIND_BOUND = 0x10 as const;
export const UC_TOKEN_KIND_DELIMITER = 0x20 as const;
export const UC_TOKEN_KIND_IS_RESERVED = UC_TOKEN_KIND_BOUND | UC_TOKEN_KIND_DELIMITER;

export type UcTokenKind =
  | typeof UC_TOKEN_KIND_STRING
  | typeof UC_TOKEN_KIND_PADDING
  | typeof UC_TOKEN_KIND_NL
  | typeof UC_TOKEN_KIND_BOUND
  | typeof UC_TOKEN_KIND_DELIMITER;

export function ucTokenKind(token: UcToken): UcTokenKind {
  if (typeof token === 'string') {
    return UC_TOKEN_KIND_STRING;
  }

  const mask = token & 0xff;

  switch (mask) {
    case UC_TOKEN_PREFIX_SPACE:
    case UC_TOKEN_PREFIX_TAB:
      return UC_TOKEN_KIND_PADDING;
    case UC_TOKEN_LF:
    case UC_TOKEN_CR:
      return UC_TOKEN_KIND_NL;
    case UC_TOKEN_COMMA:
    case UC_TOKEN_OPENING_PARENTHESIS:
    case UC_TOKEN_CLOSING_PARENTHESIS:
      return UC_TOKEN_KIND_BOUND;
    default:
      return UC_TOKEN_KIND_DELIMITER;
  }
}

export function isWhitespaceUcToken(token: UcToken): boolean {
  if (typeof token !== 'number') {
    return false;
  }

  const mask = token & 0xff;

  return (
    mask === UC_TOKEN_PREFIX_SPACE
    || mask === UC_TOKEN_LF
    || mask === UC_TOKEN_PREFIX_TAB
    || mask === UC_TOKEN_CR
  );
}

export function isUcBoundToken(token: UcToken): boolean {
  return (
    token === UC_TOKEN_COMMA
    || token === UC_TOKEN_OPENING_PARENTHESIS
    || token === UC_TOKEN_CLOSING_PARENTHESIS
  );
}

export function isUcParenthesisToken(token: UcToken): boolean {
  return token === UC_TOKEN_OPENING_PARENTHESIS || token === UC_TOKEN_CLOSING_PARENTHESIS;
}
