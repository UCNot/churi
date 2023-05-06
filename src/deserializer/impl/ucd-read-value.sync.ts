/* istanbul ignore file */
/* eslint-disable */
/* @formatter:off */
/*
 * Converted from: ucd-read-value.ts
 *
 * !!! DO NOT MODIFY !!!
 */
import { printUcTokens } from '../../syntax/print-uc-token.js';
import { trimUcTokensTail } from '../../syntax/trim-uc-tokens-tail.js';
import {
  UC_TOKEN_KIND_BOUND,
  UC_TOKEN_KIND_IS_WHITESPACE,
  UC_TOKEN_KIND_NL,
  isUcBoundToken,
  isUcParenthesisToken,
  isWhitespaceUcToken,
  ucTokenKind,
} from '../../syntax/uc-token-kind.js';
import {
  UC_TOKEN_APOSTROPHE,
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_COMMA,
  UC_TOKEN_DOLLAR_SIGN,
  UC_TOKEN_EXCLAMATION_MARK,
  UC_TOKEN_OPENING_PARENTHESIS,
  UcToken,
} from '../../syntax/uc-token.js';
import { SyncUcdReader } from '../sync-ucd-reader.js';
import { appendUcTokens } from './append-uc-token.js';
import { UcrxHandle } from './ucrx-handle.js';

export function ucdReadValueSync(
  reader: SyncUcdReader,
  rx: UcrxHandle,
  end?: (rx: UcrxHandle) => void,
  single?: boolean, // Never set for the first item of the list, unless it is non-empty.
): void {
  ucdSkipWhitespaceSync(reader);

  const firstToken = reader.current();
  let hasValue = false;

  if (!firstToken) {
    // End of input.
    // Decode as empty string.
    rx.str('');

    return;
  }
  if (firstToken === UC_TOKEN_EXCLAMATION_MARK) {
    ucdReadEntityOrTrueSync(reader, rx);

    if (single) {
      return;
    }

    hasValue = true;
  } else if (firstToken === UC_TOKEN_APOSTROPHE) {
    reader.skip(); // Skip apostrophe.

    rx.str(printUcTokens(ucdReadTokensSync(reader, rx)));

    if (single) {
      return;
    }

    hasValue = true;
  } else if (firstToken === UC_TOKEN_DOLLAR_SIGN) {
    reader.skip(); // Skip dollar prefix.

    const bound = ucdFindAnyBoundSync(reader, rx);
    const key = printUcTokens(trimUcTokensTail(reader.consumePrev()));

    if (bound === UC_TOKEN_OPENING_PARENTHESIS) {
      ucdReadMapSync(reader, rx, key);
    } else if (!key) {
      // End of input and no key.
      // Empty map.
      rx.emptyMap();
    } else {
      // End of input.
      // Map containing single key with empty value.
      rx.onlySuffix(key);
    }

    if (single) {
      return;
    }

    hasValue = true;
  }

  if (reader.current() === UC_TOKEN_OPENING_PARENTHESIS) {
    ucdReadNestedListSync(reader, rx);

    if (single) {
      return;
    }

    ucdSkipWhitespaceSync(reader);

    if (reader.current() === UC_TOKEN_COMMA) {
      // Skip optional comma and whitespace after it.
      reader.skip();
      ucdSkipWhitespaceSync(reader);
    }

    return ucdReadItemsSync(reader, rx);
  }

  if (!(ucdFindStrictBoundSync(reader, rx))) {
    // No bound found at all.
    // Treat as single value.
    if (!hasValue) {
      rx.decode(printUcTokens(trimUcTokensTail(ucdReadTokensSync(reader, rx))));

      if (single) {
        return;
      }
    }
  }

  const bound = reader.current();

  if (!bound) {
    // End of input.
    return end?.(rx);
  }
  if (bound === UC_TOKEN_CLOSING_PARENTHESIS) {
    // Unbalanced closing parenthesis.
    // Consume up to its position.
    if (!hasValue) {
      rx.decode(printUcTokens(trimUcTokensTail(reader.consumePrev())));
    }

    return end?.(rx);
  }

  if (bound === UC_TOKEN_COMMA) {
    // List.
    rx.and();
    if (reader.hasPrev()) {
      // Decode leading item, if any.
      rx.decode(printUcTokens(trimUcTokensTail(reader.consumePrev())));

      if (single) {
        // Do not parse the rest of items.
        return;
      }
    } else if (single) {
      // Decode empty item, unless it is a first one.
      rx.str('');

      return;
    }
  } else {
    // Map.
    const key = printUcTokens(trimUcTokensTail(reader.consumePrev()));

    ucdReadMapSync(reader, rx, key);
    if (single || !reader.current() || reader.current() === UC_TOKEN_CLOSING_PARENTHESIS) {
      // No next item.
      return;
    }
  }

  if (reader.current() === UC_TOKEN_COMMA) {
    // Skip comma and whitespace after it.
    reader.skip();
    ucdSkipWhitespaceSync(reader);
  }

  return ucdReadItemsSync(reader, rx);
}

function ucdReadEntityOrTrueSync(reader: SyncUcdReader, rx: UcrxHandle): void {
  const tokens = ucdReadTokensSync(reader, rx, true);

  if (trimUcTokensTail(tokens).length === 1) {
    // Process single exclamation mark.
    rx.bol(true);
  } else {
    // Process entity.
    rx.ent(tokens);
  }
}

function ucdReadTokensSync(
  reader: SyncUcdReader,
  rx: UcrxHandle,
  balanceParentheses = false,
): UcToken[] {
  const tokens: UcToken[] = [];
  let openedParentheses = 0;

  for (;;) {
    let bound: UcToken | undefined;

    if (openedParentheses) {
      bound = reader.find(token => (isUcParenthesisToken(token) ? true : null));
    } else {
      // Search for commas only _outside_ parentheses.
      bound = reader.find(token => (isUcBoundToken(token) ? true : null));
    }

    if (!bound) {
      // No bound found.
      // Accept _full_ input.
      appendUcTokens(tokens, reader.consume());

      if (balanceParentheses && openedParentheses) {
        const len = tokens.length;

        tokens.length += openedParentheses;
        tokens.fill(UC_TOKEN_CLOSING_PARENTHESIS, len);
      }

      return tokens;
    }

    if (bound === UC_TOKEN_OPENING_PARENTHESIS) {
      // Open one more parenthesis.
      ++openedParentheses;
      tokens.push(...reader.consume());
    } else if (openedParentheses) {
      // Closing parenthesis matching the opened one.
      // This can not be a comma, as they are not searched for _inside_ parenthesis.
      --openedParentheses;
      appendUcTokens(tokens, reader.consume());
    } else {
      // Either closing parenthesis not matching the opening one, or a comma.
      // In either case, this is the end of input.

      if (bound === UC_TOKEN_COMMA) {
        rx.and();
      }

      appendUcTokens(tokens, reader.consumePrev());

      return tokens;
    }
  }
}

function ucdReadNestedListSync(reader: SyncUcdReader, rx: UcrxHandle): void {
  const itemsRx = rx.nls();

  // Skip opening parenthesis and whitespace following it.
  reader.skip();
  ucdSkipWhitespaceSync(reader);

  if (reader.current() === UC_TOKEN_COMMA) {
    // Skip leading comma.
    reader.skip();
    ucdSkipWhitespaceSync(reader);
  }

  ucdReadItemsSync(reader, itemsRx, true);

  if (reader.current() === UC_TOKEN_CLOSING_PARENTHESIS) {
    // Skip closing parenthesis.
    reader.skip();
  }

  ucdSkipWhitespaceSync(reader);
}

function ucdReadItemsSync(
  reader: SyncUcdReader,
  rx: UcrxHandle,
  firstItem = false,
): void {
  for (;;) {
    const current = reader.current();

    if (!current || current === UC_TOKEN_CLOSING_PARENTHESIS) {
      // End of list.
      break;
    }

    if (firstItem) {
      firstItem = false;
    } else {
      rx.nextItem();
    }
    ucdReadValueSync(reader, rx, undefined, true);

    if (reader.current() === UC_TOKEN_COMMA) {
      // Skip comma and whitespace following it.
      reader.skip();
      ucdSkipWhitespaceSync(reader);
    }
  }

  rx.end();
}

function ucdReadMapSync(reader: SyncUcdReader, rx: UcrxHandle, firstKey: string): void {
  reader.skip(); // Skip opening parentheses.

  const entryRx = rx.firstEntry(firstKey);

  ucdReadValueSync(reader, entryRx, rx => rx.end());

  const bound = reader.current();

  if (bound) {
    // Skip closing parenthesis.
    reader.skip();

    // Read the rest of entries.
    ucdReadEntriesSync(reader, rx);
  }

  rx.endMap();

  if (!bound) {
    // End of input.
    // Ensure list charge completed, if any.
    rx.end();
  }
}

function ucdReadEntriesSync(reader: SyncUcdReader, rx: UcrxHandle): void {
  for (;;) {
    ucdSkipWhitespaceSync(reader);

    const bound = ucdFindAnyBoundSync(reader, rx);
    const keyTokens = trimUcTokensTail(reader.consumePrev());

    if (!keyTokens.length) {
      // No key.
      if (bound === UC_TOKEN_OPENING_PARENTHESIS) {
        // Nested list ends the map and starts enclosing list charge.
        // But enclosing list charge should start _before_ the map charge completed.
        rx.andBeforeNls();
      }

      break;
    }

    const key = printUcTokens(
      keyTokens[0] === UC_TOKEN_DOLLAR_SIGN ? keyTokens.slice(1) : keyTokens,
    );

    if (bound === UC_TOKEN_OPENING_PARENTHESIS) {
      // Next entry.
      reader.skip(); // Skip opening parenthesis.

      const entryRx = rx.nextEntry(key);

      ucdReadValueSync(reader, entryRx, rx => rx.end());

      if (!reader.current()) {
        // End of input.
        break;
      }

      reader.skip(); // Skip closing parenthesis.
    } else {
      // Suffix.
      rx.suffix(key);

      break;
    }
  }
}

function ucdSkipWhitespaceSync(reader: SyncUcdReader): void {
  if (reader.find(token => (isWhitespaceUcToken(token) ? null : true))) {
    reader.omitPrev();
  }
}

function ucdFindAnyBoundSync(
  reader: SyncUcdReader,
  rx: UcrxHandle,
): UcToken | undefined {
  return reader.find(token => {
    if (isUcBoundToken(token)) {
      if (token === UC_TOKEN_COMMA) {
        rx.and();
      }

      return true;
    }

    return null;
  });
}

function ucdFindStrictBoundSync(
  reader: SyncUcdReader,
  rx: UcrxHandle,
): UcToken | undefined {
  let newLine = false;
  let allowArgs = true;

  return reader.find(token => {
    const kind = ucTokenKind(token);

    if (kind & UC_TOKEN_KIND_BOUND) {
      if (token === UC_TOKEN_COMMA) {
        rx.and();
      }

      return allowArgs || token !== UC_TOKEN_OPENING_PARENTHESIS;
    }

    if (kind & UC_TOKEN_KIND_IS_WHITESPACE) {
      if (kind === UC_TOKEN_KIND_NL) {
        newLine = true;
      }
    } else if (newLine) {
      // Prohibit arguments on a new line once there is some non-whitespace token on that line.
      allowArgs = false;
    }

    return;
  });
}
