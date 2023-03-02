import { printUcTokens } from '../../syntax/print-uc-token.js';
import {
  ucTokenKind,
  UC_TOKEN_KIND_IS_RESERVED,
  UC_TOKEN_KIND_NL,
  UC_TOKEN_KIND_PADDING,
  UC_TOKEN_KIND_STRING,
} from '../../syntax/uc-token-kind.js';
import { UcToken } from '../../syntax/uc-token.js';

export function appendUcTokens(target: UcToken[], tokens: readonly UcToken[]): void {
  tokens.forEach(token => appendUcToken(target, token));
}

export function appendUcToken(target: UcToken[], token: UcToken): void {
  if (!target.length) {
    // First token.
    target.push(token);

    return;
  }

  const kind = ucTokenKind(token);

  if (kind & UC_TOKEN_KIND_IS_NL_OR_RESERVED) {
    // NL or reserved token appended as is.
    target.push(token);

    return;
  }

  const prevIdx = target.length - 1;

  if (kind === UC_TOKEN_KIND_STRING) {
    mergePaddedStrings(target, token as string);

    return;
  }

  const prevToken = target[prevIdx];
  const prevKind = ucTokenKind(prevToken);

  if (prevKind & UC_TOKEN_KIND_IS_NL_OR_RESERVED || kind !== prevKind) {
    // Token kind changed or preceding token was NL or reserved one.
    target.push(token);

    return;
  }

  // Handle paddings.
  const pad = (token as number) & 0xff;
  const prevPad = (prevToken as number) & 0xff;

  if (pad !== prevPad) {
    // Padding changed
    target.push(token);

    return;
  }

  // Concatenate paddings.
  const padRepeats = (token as number) >>> 8;
  const prevPadRepeats = (prevToken as number) >>> 8;
  const newRepeats = prevPadRepeats + padRepeats + 1;
  const overflowRepeats = newRepeats - 256;

  if (overflowRepeats >= 0) {
    // At most 255 repeats allowed.
    target[prevIdx] = pad | 0xff00;
    target.push(pad | (overflowRepeats << 8));
  } else {
    // Increase the number of repeats.
    target[prevIdx] = pad | (newRepeats << 8);
  }
}

const UC_TOKEN_KIND_IS_NL_OR_RESERVED = UC_TOKEN_KIND_NL | UC_TOKEN_KIND_IS_RESERVED;

function mergePaddedStrings(target: UcToken[], appended: string): void {
  // Iterate over paddings backward until preceding string found.
  for (let i = target.length - 1; i >= 0; --i) {
    const kind = ucTokenKind(target[i]);

    if (kind === UC_TOKEN_KIND_STRING) {
      // Preceding string found.
      // Concatenate it with all paddings and new token.
      target[i] = printUcTokens(target.slice(i)) + appended;
      target.length = i + 1;

      return;
    }
    if (kind !== UC_TOKEN_KIND_PADDING) {
      // Non-string token precedes paddings.
      // Merging is impossible.
      break;
    }
  }

  target.push(appended);
}
