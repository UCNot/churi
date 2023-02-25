import { isWhitespaceUcToken } from '../../syntax/uc-token-kind.js';
import {
  UcToken,
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_COMMA,
  UC_TOKEN_OPENING_PARENTHESIS,
} from '../../syntax/uc-token.js';

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

export function trimUcTokensTail(tokens: readonly UcToken[]): readonly UcToken[];
export function trimUcTokensTail(tokens: UcToken[]): UcToken[];

export function trimUcTokensTail(tokens: readonly UcToken[]): readonly UcToken[] {
  const last = tokens.length - 1;

  for (let i = last; i >= 0; --i) {
    if (!isWhitespaceUcToken(tokens[i])) {
      return i === last ? tokens : tokens.slice(0, i + 1);
    }
  }

  return [];
}
