import { asis } from '@proc7ts/primitives';
import {
  UC_TOKEN_CR,
  UC_TOKEN_CRLF,
  UC_TOKEN_PREFIX_SPACE,
  UC_TOKEN_PREFIX_TAB,
  UcToken,
} from './uc-token.js';

export function printUcTokens(
  tokens: readonly UcToken[],
  encodeString: (token: string) => string = asis,
): string {
  return tokens.map(token => printUcToken(token, encodeString)).join('');
}

export function printUcToken(token: UcToken, encodeString?: (token: string) => string): string {
  if (typeof token === 'string') {
    return encodeString ? encodeString(token) : token;
  }

  switch (token & 0xff) {
    case UC_TOKEN_PREFIX_SPACE:
      return ' '.repeat((token >>> 8) + 1);
    case UC_TOKEN_PREFIX_TAB:
      return '\t'.repeat((token >>> 8) + 1);
    case UC_TOKEN_CR:
      return token === UC_TOKEN_CRLF ? '\r\n' : '\r';
  }

  return String.fromCharCode(token);
}
