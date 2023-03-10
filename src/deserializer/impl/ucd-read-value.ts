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
  UC_TOKEN_KIND_NL,
} from '../../syntax/uc-token-kind.js';
import {
  UcToken,
  UC_TOKEN_APOSTROPHE,
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_COMMA,
  UC_TOKEN_DOLLAR_SIGN,
  UC_TOKEN_EXCLAMATION_MARK,
  UC_TOKEN_OPENING_PARENTHESIS,
} from '../../syntax/uc-token.js';
import { AsyncUcdReader } from '../async-ucd-reader.js';
import { appendUcTokens } from './append-uc-token.js';
import { ucdDecodeValue } from './ucd-decode-value.js';
import { cacheUcdEntry, startUcdEntry, UcdEntryCache } from './ucd-entity-cache.js';

export async function ucdReadValue(
  reader: AsyncUcdReader,
  rx: Ucrx,
  end?: () => void,
  single?: boolean,
): Promise<void> {
  await ucdSkipWhitespace(reader);

  const firstToken = reader.current();
  let hasValue = false;

  if (!firstToken) {
    // End of input.
    // Decode as empty string.
    return ucrxString(reader, rx, '');
  }
  if (firstToken === UC_TOKEN_EXCLAMATION_MARK) {
    await ucdReadEntityOrTrue(reader, rx);

    if (single) {
      return;
    }

    hasValue = true;
  } else if (firstToken === UC_TOKEN_APOSTROPHE) {
    reader.skip(); // Skip apostrophe.

    ucrxString(reader, rx, printUcTokens(await ucdReadTokens(reader)));

    if (single) {
      return;
    }

    hasValue = true;
  } else if (firstToken === UC_TOKEN_DOLLAR_SIGN) {
    reader.skip(); // Skip dollar prefix.

    const bound = await ucdFindAnyBound(reader);
    const key = printUcTokens(trimUcTokensTail(reader.consumePrev()));

    if (bound === UC_TOKEN_OPENING_PARENTHESIS) {
      await ucdReadMap(reader, rx, key);
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
    await ucdReadNestedList(reader, rx);

    if (single) {
      return;
    }

    await ucdSkipWhitespace(reader);

    if (reader.current() === UC_TOKEN_COMMA) {
      // Skip optional comma and whitespace after it.
      reader.skip();
      await ucdSkipWhitespace(reader);
    }

    return await ucdReadItems(reader, rx);
  }

  if (!(await ucdFindStrictBound(reader))) {
    // No bound found at all.
    // Treat as single value.
    if (!hasValue) {
      ucdDecodeValue(reader, rx, printUcTokens(trimUcTokensTail(await ucdReadTokens(reader))));

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

    await ucdReadMap(reader, rx, key);
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
    await ucdSkipWhitespace(reader);
  }

  return await ucdReadItems(reader, itemsRx);
}

async function ucdReadEntityOrTrue(reader: AsyncUcdReader, rx: Ucrx): Promise<void> {
  const tokens = await ucdReadTokens(reader, true);

  if (trimUcTokensTail(tokens).length === 1) {
    // Process single exclamation mark.
    ucrxBoolean(reader, rx, true);
  } else {
    // Process entity.
    reader.entity(rx, tokens);
  }
}

async function ucdReadTokens(
  reader: AsyncUcdReader,
  balanceParentheses = false,
): Promise<UcToken[]> {
  const tokens: UcToken[] = [];
  let openedParentheses = 0;

  for (;;) {
    let bound: UcToken | undefined;

    if (openedParentheses) {
      bound = await reader.find(token => (isUcParenthesisToken(token) ? true : null));
    } else {
      // Search for commas only _outside_ parentheses.
      bound = await reader.find(token => (isUcBoundToken(token) ? true : null));
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

async function ucdReadNestedList(reader: AsyncUcdReader, rx: Ucrx): Promise<void> {
  rx.em?.(); // Enclosing value is a list.

  let itemsRx = rx._.nls?.();

  if (!itemsRx) {
    reader.error(ucrxUnexpectedTypeError('nested list', rx));
    itemsRx = UCRX_OPAQUE;
  }

  itemsRx.em!();

  // Skip opening parenthesis and whitespace following it.
  reader.skip();
  await ucdSkipWhitespace(reader);

  await ucdReadItems(reader, itemsRx);

  if (reader.current() === UC_TOKEN_CLOSING_PARENTHESIS) {
    // Skip closing parenthesis.
    reader.skip();
  }

  await ucdSkipWhitespace(reader);
}

async function ucdReadItems(reader: AsyncUcdReader, rx: Ucrx): Promise<void> {
  for (;;) {
    const current = reader.current();

    if (!current || current === UC_TOKEN_CLOSING_PARENTHESIS) {
      // End of list.
      break;
    }

    await ucdReadValue(reader, rx, undefined, true);

    if (reader.current() === UC_TOKEN_COMMA) {
      // Skip comma and whitespace following it.
      reader.skip();
      await ucdSkipWhitespace(reader);
    }
  }

  rx.ls?.();
}

async function ucdReadMap(reader: AsyncUcdReader, rx: Ucrx, firstKey: string): Promise<void> {
  reader.skip(); // Skip opening parentheses.

  const mapRx = ucrxMap(reader, rx);
  const entryRx = ucrxEntry(reader, mapRx, firstKey);

  await ucdReadValue(reader, entryRx);

  if (reader.current()) {
    // Skip closing parenthesis.
    reader.skip();

    const cache: UcdEntryCache = { rxs: {}, end: null };

    cacheUcdEntry(cache, firstKey, entryRx);

    // Read the rest of entries.
    await ucdReadEntries(reader, mapRx, cache);
  } else {
    entryRx.ls?.();
  }

  mapRx.map();
}

async function ucdReadEntries(
  reader: AsyncUcdReader,
  mapRx: UcrxMap,
  cache: UcdEntryCache,
): Promise<void> {
  for (;;) {
    await ucdSkipWhitespace(reader);

    const bound = await ucdFindAnyBound(reader);
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

      await ucdReadValue(reader, entryRx);

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

async function ucdSkipWhitespace(reader: AsyncUcdReader): Promise<void> {
  if (await reader.find(token => (isWhitespaceUcToken(token) ? null : true))) {
    reader.omitPrev();
  }
}

async function ucdFindAnyBound(reader: AsyncUcdReader): Promise<UcToken | undefined> {
  return await reader.find(token => (isUcBoundToken(token) ? true : null));
}

async function ucdFindStrictBound(reader: AsyncUcdReader): Promise<UcToken | undefined> {
  let newLine = false;
  let allowArgs = true;

  return await reader.find(token => {
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
