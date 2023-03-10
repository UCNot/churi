/* istanbul ignore file */
/* eslint-disable */
/* @formatter:off */
/*
 * Converted from: ucd-read-value.ts
 *
 * !!! DO NOT MODIFY !!!
 */
import { ucrxUnexpectedTypeError } from '../../rx/ucrx-errors.js';
import { ucrxBoolean, ucrxEntry, ucrxMap, ucrxString, ucrxSuffix } from '../../rx/ucrx-value.js';
import { Ucrx, UcrxMap, UCRX_OPAQUE } from '../../rx/ucrx.js';
import { printUcTokens } from '../../syntax/print-uc-token.js';
import { trimUcTokensTail } from '../../syntax/trim-uc-tokens-tail.js';
import {
    isUcBoundToken,
    isUcParenthesisToken,
    isWhitespaceUcToken,
    ucTokenKind,
    UC_TOKEN_KIND_BOUND,
    UC_TOKEN_KIND_IS_WHITESPACE,
    UC_TOKEN_KIND_NL
} from '../../syntax/uc-token-kind.js';
import {
    UcToken,
    UC_TOKEN_APOSTROPHE,
    UC_TOKEN_CLOSING_PARENTHESIS,
    UC_TOKEN_COMMA,
    UC_TOKEN_DOLLAR_SIGN,
    UC_TOKEN_EXCLAMATION_MARK,
    UC_TOKEN_OPENING_PARENTHESIS
} from '../../syntax/uc-token.js';
import { SyncUcdReader } from '../sync-ucd-reader.js';
import { appendUcTokens } from './append-uc-token.js';
import { ucdDecodeValue } from './ucd-decode-value.js';
import { cacheUcdEntry, startUcdEntry, UcdEntryCache } from './ucd-entity-cache.js';

export function ucdReadValueSync(
  reader: SyncUcdReader,
  rx: Ucrx,
  end?: () => void,
  single?: boolean,
): void {
  ucdSkipWhitespaceSync(reader);

  const firstToken = reader.current();
  let hasValue = false;

  if (!firstToken) {
    // End of input.
    // Decode as empty string.
    return ucrxString(reader, rx, '');
  }
  if (firstToken === UC_TOKEN_EXCLAMATION_MARK) {
    ucdReadEntityOrTrueSync(reader, rx);

    if (single) {
      return;
    }

    hasValue = true;
  } else if (firstToken === UC_TOKEN_APOSTROPHE) {
    reader.skip(); // Skip apostrophe.

    ucrxString(reader, rx, printUcTokens(ucdReadTokensSync(reader)));

    if (single) {
      return;
    }

    hasValue = true;
  } else if (firstToken === UC_TOKEN_DOLLAR_SIGN) {
    reader.skip(); // Skip dollar prefix.

    const bound = ucdFindAnyBoundSync(reader);
    const key = printUcTokens(trimUcTokensTail(reader.consumePrev()));

    if (bound === UC_TOKEN_OPENING_PARENTHESIS) {
      ucdReadMapSync(reader, rx, key);
    } else {
      // End of input.
      // Map containing single key with empty value.
      ucrxSuffix(reader, rx, key);
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

  if (!(ucdFindStrictBoundSync(reader))) {
    // No bound found at all.
    // Treat as single value.
    if (!hasValue) {
      ucdDecodeValue(reader, rx, printUcTokens(trimUcTokensTail(ucdReadTokensSync(reader))));

      if (single) {
        return;
      }
    }
  }

  const bound = reader.current();

  if (!bound) {
    // End of input.
    return end?.();
  }
  if (bound === UC_TOKEN_CLOSING_PARENTHESIS) {
    // Unbalanced closing parenthesis.
    // Consume up to its position.
    if (!hasValue) {
      ucdDecodeValue(reader, rx, printUcTokens(trimUcTokensTail(reader.consumePrev())));
    }

    return end?.();
  }

  let itemsRx: Ucrx;

  if (bound === UC_TOKEN_COMMA) {
    // List.
    if (single || rx.em?.()) {
      itemsRx = rx;
    } else {
      reader.error(ucrxUnexpectedTypeError('list', rx));
      itemsRx = UCRX_OPAQUE;
    }
    if (reader.hasPrev()) {
      // Decode leading item, if any.
      // Ignore empty leading item otherwise.
      ucdDecodeValue(reader, itemsRx, printUcTokens(trimUcTokensTail(reader.consumePrev())));
    }

    if (single) {
      // Do not parse the rest of items.
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

    // Consume the rest of items.
    if (rx.em?.()) {
      itemsRx = rx;
    } else {
      reader.error(
        ucrxUnexpectedTypeError(
          reader.current() === UC_TOKEN_OPENING_PARENTHESIS ? 'nested list' : 'list',
          rx,
        ),
      );
      itemsRx = UCRX_OPAQUE;
    }
  }

  if (reader.current() === UC_TOKEN_COMMA) {
    // Skip comma and whitespace after it.
    reader.skip();
    ucdSkipWhitespaceSync(reader);
  }

  return ucdReadItemsSync(reader, itemsRx);
}

function ucdReadEntityOrTrueSync(reader: SyncUcdReader, rx: Ucrx): void {
  const tokens = ucdReadTokensSync(reader, true);

  if (trimUcTokensTail(tokens).length === 1) {
    // Process single exclamation mark.
    ucrxBoolean(reader, rx, true);
  } else {
    // Process entity.
    reader.entity(rx, tokens);
  }
}

function ucdReadTokensSync(
  reader: SyncUcdReader,
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

      /* istanbul ignore next */
      if (balanceParentheses && openedParentheses) {
        tokens.fill(
          UC_TOKEN_CLOSING_PARENTHESIS,
          tokens.length,
          tokens.length + openedParentheses - 1,
        );
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
      appendUcTokens(tokens, reader.consumePrev());

      return tokens;
    }
  }
}

function ucdReadNestedListSync(reader: SyncUcdReader, rx: Ucrx): void {
  rx.em?.(); // Enclosing value is a list.

  let itemsRx = rx._.nls?.();

  if (!itemsRx) {
    reader.error(ucrxUnexpectedTypeError('nested list', rx));
    itemsRx = UCRX_OPAQUE;
  }

  itemsRx.em!();

  // Skip opening parenthesis and whitespace following it.
  reader.skip();
  ucdSkipWhitespaceSync(reader);

  ucdReadItemsSync(reader, itemsRx);

  if (reader.current() === UC_TOKEN_CLOSING_PARENTHESIS) {
    // Skip closing parenthesis.
    reader.skip();
  }

  ucdSkipWhitespaceSync(reader);
}

function ucdReadItemsSync(reader: SyncUcdReader, rx: Ucrx): void {
  for (;;) {
    const current = reader.current();

    if (!current || current === UC_TOKEN_CLOSING_PARENTHESIS) {
      // End of list.
      break;
    }

    ucdReadValueSync(reader, rx, undefined, true);

    if (reader.current() === UC_TOKEN_COMMA) {
      // Skip comma and whitespace following it.
      reader.skip();
      ucdSkipWhitespaceSync(reader);
    }
  }

  rx.ls?.();
}

function ucdReadMapSync(reader: SyncUcdReader, rx: Ucrx, firstKey: string): void {
  reader.skip(); // Skip opening parentheses.

  const mapRx = ucrxMap(reader, rx);
  const entryRx = ucrxEntry(reader, mapRx, firstKey);

  ucdReadValueSync(reader, entryRx);

  if (reader.current()) {
    // Skip closing parenthesis.
    reader.skip();

    const cache: UcdEntryCache = { rxs: {}, end: null };

    cacheUcdEntry(cache, firstKey, entryRx);

    // Read the rest of entries.
    ucdReadEntriesSync(reader, mapRx, cache);
  } else {
    entryRx.ls?.();
  }

  mapRx.map();
}

function ucdReadEntriesSync(
  reader: SyncUcdReader,
  mapRx: UcrxMap,
  cache: UcdEntryCache,
): void {
  for (;;) {
    ucdSkipWhitespaceSync(reader);

    const bound = ucdFindAnyBoundSync(reader);
    const keyTokens = trimUcTokensTail(reader.consumePrev());

    if (!keyTokens.length) {
      // No key.
      break;
    }

    const key = printUcTokens(
      keyTokens[0] === UC_TOKEN_DOLLAR_SIGN ? keyTokens.slice(1) : keyTokens,
    );

    if (bound === UC_TOKEN_OPENING_PARENTHESIS) {
      // Next entry.
      reader.skip(); // Skip opening parenthesis.

      const entryRx = startUcdEntry(reader, mapRx, key, cache);

      ucdReadValueSync(reader, entryRx);

      if (!reader.current()) {
        // End of input.
        break;
      }

      reader.skip(); // Skip closing parenthesis.
    } else {
      // Suffix.
      const entryRx = startUcdEntry(reader, mapRx, key, cache);

      ucrxString(reader, entryRx, '');

      break;
    }
  }

  cache?.end?.forEach(rx => rx.ls!());
}

function ucdSkipWhitespaceSync(reader: SyncUcdReader): void {
  if (reader.find(token => (isWhitespaceUcToken(token) ? null : true))) {
    reader.omitPrev();
  }
}

function ucdFindAnyBoundSync(reader: SyncUcdReader): UcToken | undefined {
  return reader.find(token => (isUcBoundToken(token) ? true : null));
}

function ucdFindStrictBoundSync(reader: SyncUcdReader): UcToken | undefined {
  let newLine = false;
  let allowArgs = true;

  return reader.find(token => {
    const kind = ucTokenKind(token);

    if (kind & UC_TOKEN_KIND_BOUND) {
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
