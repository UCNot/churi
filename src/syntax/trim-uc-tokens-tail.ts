import { isWhitespaceUcToken } from './uc-token-kind.js';
import { UcToken } from './uc-token.js';

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
