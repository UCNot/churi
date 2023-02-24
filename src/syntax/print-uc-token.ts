import { UcToken, UC_TOKEN_PREFIX_SPACE, UC_TOKEN_PREFIX_TAB } from './uc-token.js';

export function printUcTokens(tokens: readonly UcToken[]): string {
  return tokens.map(printUcToken).join('');
}

export function printUcToken(token: UcToken): string {
  if (typeof token === 'string') {
    return token;
  }

  if (token < 0x7f) {
    return String.fromCharCode(token);
  }

  const mask = token & 0xff;

  switch (mask) {
    case UC_TOKEN_PREFIX_SPACE:
      return ' '.repeat((token >>> 8) + 1);
    case UC_TOKEN_PREFIX_TAB:
      return '\t'.repeat((token >>> 8) + 1);
    default:
      return '\r\n';
  }
}
