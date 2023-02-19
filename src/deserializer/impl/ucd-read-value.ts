import { unchargeURIKey } from '../../charge/charge-uri.js';
import { UcdReader } from '../ucd-reader.js';
import { UcdMapRx, UcdRx } from '../ucd-rx.js';
import { ucdDecodeValue, ucdRxBoolean, ucdRxString } from './ucd-decode-value.js';
import { ucdUnexpectedEntryError, ucdUnexpectedTypeError } from './ucd-errors.js';
import { UCD_OPAQUE_RX } from './ucd-opaque-rx.js';

export async function ucdReadValue(reader: UcdReader, rx: UcdRx, single = false): Promise<void> {
  await ucdSkipWhitespace(reader);

  const { current } = reader;
  let hasValue = false;

  if (!current) {
    // End of input.
    // Decode as empty string.
    return ucdRxString(reader, rx, '');
  }
  if (current.startsWith('!')) {
    await ucdReadEntityOrTrue(reader, rx);

    if (single) {
      return;
    }

    hasValue = true;
  } else if (current.startsWith("'")) {
    reader.consume(1); // Skip apostrophe.

    ucdRxString(reader, rx, decodeURIComponent(await ucdReadRawString(reader)));

    if (single) {
      return;
    }

    hasValue = true;
  } else if (current.startsWith('$')) {
    const argIdx = await reader.search(UCD_DELIMITER_PATTERN, true);

    if (argIdx < 0) {
      // End of input.
      // Map containing single key with empty value.
      const map = ucdRxMap(reader, rx);
      const key = unchargeURIKey(reader.consume().trimEnd());
      const entryRx = ucdRxEntry(reader, map, key);

      ucdRxString(reader, entryRx, '');

      map.end();
    } else {
      const key = unchargeURIKey(reader.consume(argIdx).trimEnd());

      await ucdReadMap(reader, rx, key);
    }

    if (single) {
      return;
    }

    hasValue = true;
  } else if (current.startsWith('(')) {
    await ucdReadNestedList(reader, rx);

    if (single) {
      return;
    }

    await ucdSkipWhitespace(reader);

    if (reader.current?.startsWith(',')) {
      // Skip optional comma and whitespace after it.
      reader.consume(1);
      await ucdSkipWhitespace(reader);
    }

    return await ucdReadItems(reader, rx);
  }

  let delimiterIdx = await reader.search(UCD_DELIMITER_PATTERN);

  if (delimiterIdx < 0) {
    // No delimiter found at the same line.
    // Try to find on new line.
    await reader.next();

    delimiterIdx = await reader.search(UCD_NL_DELIMITER_PATTERN, true);

    if (delimiterIdx < 0) {
      // No delimiter found at all.
      // Treat as single value.
      if (!hasValue) {
        const value = await ucdReadRawString(reader);

        ucdDecodeValue(reader, rx, value.trimEnd());
        if (single) {
          return;
        }
      }
    }
  }

  if (!reader.current) {
    // End of input.
    return;
  }

  const delimiter = reader.current[delimiterIdx];

  if (delimiter === ')') {
    // Unbalanced closing parenthesis.
    // Consume up to its position.
    if (!hasValue) {
      ucdDecodeValue(reader, rx, reader.consume(delimiterIdx).trimEnd());
    }

    return;
  }

  let itemsRx: UcdRx;

  if (delimiter === ',') {
    // End of list item.
    // List item.
    if (single || rx.lst?.()) {
      itemsRx = rx;
    } else {
      reader.error(ucdUnexpectedTypeError('list', rx));
      itemsRx = UCD_OPAQUE_RX;
    }
    if (delimiterIdx) {
      // Decode leading item, if eny.
      // Ignore empty leading item otherwise.
      ucdDecodeValue(reader, itemsRx, reader.consume(delimiterIdx).trimEnd());
    }

    if (single) {
      // Do not parse the rest of items.
      return;
    }
  } else {
    // Map.
    const key = unchargeURIKey(reader.consume(delimiterIdx).trimEnd());

    await ucdReadMap(reader, rx, key);
    if (single || !reader.current || reader.current.startsWith(')')) {
      // No next item.
      return;
    }

    // Consume the rest of items.
    if (rx.lst?.()) {
      itemsRx = rx;
    } else {
      reader.error(ucdUnexpectedTypeError('list', rx));
      itemsRx = UCD_OPAQUE_RX;
    }
  }

  // Skip comma and whitespace after it.
  reader.consume(1);
  await ucdSkipWhitespace(reader);

  return await ucdReadItems(reader, itemsRx);
}

async function ucdReadEntityOrTrue(reader: UcdReader, rx: UcdRx): Promise<void> {
  const entityInput = await ucdReadRawString(reader, true);
  const entity = entityInput.trimEnd();

  if (entity.length === 1) {
    ucdRxBoolean(reader, rx, true);
  } else {
    // TODO Process entities.
    await Promise.reject('TODO');
  }
}

async function ucdReadRawString(reader: UcdReader, balanceParentheses = false): Promise<string> {
  let result = '';
  let openedParentheses = 0;

  for (;;) {
    const delimiterIdx = await reader.search(
      // Search for commas only _outside_ parentheses.
      openedParentheses ? UCD_PARENTHESIS_PATTERN : UCD_DELIMITER_PATTERN,
      true,
    );

    if (delimiterIdx < 0) {
      // No delimiters found.
      // Accept _full_ input.

      return balanceParentheses && openedParentheses
        ? result + reader.consume() + ')'.repeat(openedParentheses) // Close hanging parentheses.
        : result + reader.consume();
    }

    if (reader.current![delimiterIdx] === '(') {
      // Open one more parenthesis.
      ++openedParentheses;
      result += reader.consume(delimiterIdx + 1);
    } else if (openedParentheses) {
      // Closing parenthesis matching the opened one.
      // This can not be a comma, as they are not searched for _inside_ parenthesis.
      --openedParentheses;
      result += reader.consume(delimiterIdx + 1);
    } else {
      // Either closing parenthesis not matching the opening one, or a comma.
      // In either case, this is the end of input.
      return result + reader.consume(delimiterIdx);
    }
  }
}

const UCD_PARENTHESIS_PATTERN = /[()]/;
const UCD_DELIMITER_PATTERN = /[(),]/;

// Opening parentheses only accepted as the first non-whitespace char of the line.
// Comma and closing parenthesis accepted at any position.
const UCD_NL_DELIMITER_PATTERN = /(?<=^\s*)\(|[),]/;

async function ucdReadNestedList(reader: UcdReader, rx: UcdRx): Promise<void> {
  let itemsRx = rx._.nls?.();

  if (!itemsRx) {
    reader.error(ucdUnexpectedTypeError('list', rx));
    itemsRx = UCD_OPAQUE_RX;
  }

  reader.consume(1); // Skip opening parenthesis.
  await ucdReadItems(reader, itemsRx);

  if (reader.current?.startsWith(')')) {
    // Skip closing parenthesis.
    reader.consume(1);
  }

  await ucdSkipWhitespace(reader);
}

async function ucdReadItems(reader: UcdReader, rx: UcdRx): Promise<void> {
  for (;;) {
    const { current } = reader;

    if (!current || current.startsWith(')')) {
      // End of list.
      break;
    }

    await ucdReadValue(reader, rx, true);

    if (reader.current?.startsWith(',')) {
      // Skip comma and whitespace following it.
      reader.consume(1);
      await ucdSkipWhitespace(reader);
    }
  }

  rx.end?.();
}

async function ucdReadMap(reader: UcdReader, rx: UcdRx, firstKey: string): Promise<void> {
  reader.consume(1); // Skip opening parentheses.

  const mapRx = ucdRxMap(reader, rx);
  const entryRx = ucdRxEntry(reader, mapRx, firstKey);

  await ucdReadValue(reader, entryRx);

  if (reader.current) {
    // Skip closing parenthesis.
    reader.consume(1);

    // Read the rest of entries.
    await ucdReadEntries(reader, mapRx);
  }

  mapRx.end();
}

async function ucdReadEntries(reader: UcdReader, mapRx: UcdMapRx): Promise<void> {
  for (;;) {
    await ucdSkipWhitespace(reader);

    const delimiterIdx = await reader.search(UCD_DELIMITER_PATTERN, true);
    let suffix: string;

    if (delimiterIdx > 0) {
      // Next item.
      const delimiter = reader.current![delimiterIdx];
      const rawKey = reader.consume(delimiterIdx).trimEnd();

      if (!rawKey) {
        // No next entry.
        break;
      }

      if (delimiter === '(') {
        // Next entry.
        reader.consume(1); // Skip opening parenthesis.

        const entryRx = ucdRxEntry(reader, mapRx, unchargeURIKey(rawKey));

        await ucdReadValue(reader, entryRx);

        if (!reader.current) {
          // End of input.
          return;
        }

        reader.consume(1); // Skip closing parenthesis.

        continue;
      }

      suffix = rawKey;
    } else if (delimiterIdx < 0) {
      // End of input.
      suffix = reader.consume().trimEnd();
    } else {
      // No suffix.
      break;
    }

    if (suffix) {
      const key = unchargeURIKey(suffix);
      const entryRx = ucdRxEntry(reader, mapRx, key);

      ucdRxString(reader, entryRx, '');
    }

    break;
  }
}

function ucdRxMap(reader: UcdReader, rx: UcdRx): UcdMapRx {
  const mapRx = rx._.map;

  if (mapRx) {
    return mapRx;
  }

  reader.error(ucdUnexpectedTypeError('map', rx));

  return UCD_OPAQUE_RX._.map;
}

function ucdRxEntry(reader: UcdReader, mapRx: UcdMapRx, key: string): UcdRx {
  const entryRx = mapRx.for(key);

  if (entryRx) {
    return entryRx;
  }

  reader.error(ucdUnexpectedEntryError(key));

  return UCD_OPAQUE_RX;
}

async function ucdSkipWhitespace(reader: UcdReader): Promise<void> {
  const nonSpaceStart = await reader.search(UCD_NON_SPACE_PATTERN, true);

  if (nonSpaceStart > 0) {
    // Some spaces found.
    reader.consume(nonSpaceStart);
  } else if (nonSpaceStart < 0) {
    // Only spaces left.
    reader.consume();
  }
}

const UCD_NON_SPACE_PATTERN = /\S/;
