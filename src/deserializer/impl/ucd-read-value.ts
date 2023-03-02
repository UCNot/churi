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
import { ucdUnexpectedTypeError } from '../ucd-errors.js';
import {
  ucdRxBoolean,
  ucdRxEntry,
  ucdRxMap,
  ucdRxSingleEntry,
  ucdRxString,
} from '../ucd-rx-value.js';
import { UcdMapRx, UcdRx, UCD_OPAQUE_RX } from '../ucd-rx.js';
import { appendUcTokens } from './append-uc-token.js';
import { ucdDecodeValue } from './ucd-decode-value.js';

export async function ucdReadValue(
  reader: AsyncUcdReader,
  rx: UcdRx,
  single = false,
): Promise<void> {
  await ucdSkipWhitespace(reader);

  const firstToken = reader.current();
  let hasValue = false;

  if (!firstToken) {
    // End of input.
    // Decode as empty string.
    return ucdRxString(reader, rx, '');
  }
  if (firstToken === UC_TOKEN_EXCLAMATION_MARK) {
    await ucdReadEntityOrTrue(reader, rx);

    if (single) {
      return;
    }

    hasValue = true;
  } else if (firstToken === UC_TOKEN_APOSTROPHE) {
    reader.skip(); // Skip apostrophe.

    ucdRxString(reader, rx, printUcTokens(await ucdReadTokens(reader)));

    if (single) {
      return;
    }

    hasValue = true;
  } else if (firstToken === UC_TOKEN_DOLLAR_SIGN) {
    reader.skip(); // Skip dollar prefix.

    const bound = await ucdFindAnyBound(reader);

    if (bound) {
      const key = printUcTokens(trimUcTokensTail(reader.consumePrev()));

      if (bound === UC_TOKEN_OPENING_PARENTHESIS) {
        await ucdReadMap(reader, rx, key);
      } else {
        ucdRxSingleEntry(reader, rx, key);
      }
    } else {
      // End of input.
      // Map containing single key with empty value.
      ucdRxSingleEntry(reader, rx, printUcTokens(trimUcTokensTail(reader.consumePrev())));
    }

    if (single) {
      return;
    }

    hasValue = true;
  }

  if (reader.current() === UC_TOKEN_OPENING_PARENTHESIS) {
    rx.lst?.();

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
    return;
  }
  if (bound === UC_TOKEN_CLOSING_PARENTHESIS) {
    // Unbalanced closing parenthesis.
    // Consume up to its position.
    if (!hasValue) {
      ucdDecodeValue(reader, rx, printUcTokens(trimUcTokensTail(reader.consumePrev())));
    }

    return;
  }

  let itemsRx: UcdRx;

  if (bound === UC_TOKEN_COMMA) {
    // List.
    if (single || rx.lst?.()) {
      itemsRx = rx;
    } else {
      reader.error(ucdUnexpectedTypeError('list', rx));
      itemsRx = UCD_OPAQUE_RX;
    }
    if (reader.prev().length) {
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
    if (rx.lst?.()) {
      itemsRx = rx;
    } else {
      reader.error(
        ucdUnexpectedTypeError(
          reader.current() === UC_TOKEN_OPENING_PARENTHESIS ? 'nested list' : 'list',
          rx,
        ),
      );
      itemsRx = UCD_OPAQUE_RX;
    }
  }

  if (reader.current() === UC_TOKEN_COMMA) {
    // Skip comma and whitespace after it.
    reader.skip();
    await ucdSkipWhitespace(reader);
  }

  return await ucdReadItems(reader, itemsRx);
}

async function ucdReadEntityOrTrue(reader: AsyncUcdReader, rx: UcdRx): Promise<void> {
  const tokens = await ucdReadTokens(reader, true);

  if (trimUcTokensTail(tokens).length === 1) {
    // Process single exclamation mark.
    ucdRxBoolean(reader, rx, true);
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

async function ucdReadNestedList(reader: AsyncUcdReader, rx: UcdRx): Promise<void> {
  let itemsRx = rx._.nls?.();

  if (!itemsRx) {
    reader.error(ucdUnexpectedTypeError('nested list', rx));
    itemsRx = UCD_OPAQUE_RX;
  }

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

async function ucdReadItems(reader: AsyncUcdReader, rx: UcdRx): Promise<void> {
  for (;;) {
    const current = reader.current();

    if (!current || current === UC_TOKEN_CLOSING_PARENTHESIS) {
      // End of list.
      break;
    }

    await ucdReadValue(reader, rx, true);

    if (reader.current() === UC_TOKEN_COMMA) {
      // Skip comma and whitespace following it.
      reader.skip();
      await ucdSkipWhitespace(reader);
    }
  }

  rx.end?.();
}

async function ucdReadMap(reader: AsyncUcdReader, rx: UcdRx, firstKey: string): Promise<void> {
  reader.skip(); // Skip opening parentheses.

  const mapRx = ucdRxMap(reader, rx);
  const entryRx = ucdRxEntry(reader, mapRx, firstKey);

  await ucdReadValue(reader, entryRx);

  if (reader.current()) {
    // Skip closing parenthesis.
    reader.skip();

    // Read the rest of entries.
    await ucdReadEntries(reader, mapRx);
  }

  mapRx.end();
}

async function ucdReadEntries(reader: AsyncUcdReader, mapRx: UcdMapRx): Promise<void> {
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

      const entryRx = ucdRxEntry(reader, mapRx, key);

      await ucdReadValue(reader, entryRx);

      if (!reader.current()) {
        // End of input.
        return;
      }

      reader.skip(); // Skip closing parenthesis.
    } else {
      // Suffix.
      const entryRx = ucdRxEntry(reader, mapRx, key);

      ucdRxString(reader, entryRx, '');

      break;
    }
  }
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
