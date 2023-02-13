import { UcdReader } from '../ucd-reader.js';
import { UcdRx } from '../ucd-rx.js';
import { ucdDecodeValue, ucdRxBoolean, ucdRxString } from './ucd-decode-value.js';
import { ucdUnexpectedError } from './ucd-errors.js';
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

    ucdRxString(reader, rx, await ucdReadRawString(reader));

    if (single) {
      return;
    }

    hasValue = true;
  } else if (current.startsWith('$')) {
    // TODO: Map entry, possibly without arguments.
    return Promise.reject('TODO');
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

  const argStart = await reader.search(UCD_ARG_PATTERN);

  if (argStart < 0) {
    // No arg found or end of input.
    // Consume the rest of the input.
    if (!hasValue) {
      ucdDecodeValue(reader, rx, reader.consume().trimEnd());
    }

    return;
  }

  const argDelimiter = reader.current![argStart];

  if (argDelimiter === ')') {
    // Unbalanced closing parenthesis.
    // Consume up to its position.
    if (!hasValue) {
      ucdDecodeValue(reader, rx, reader.consume(argStart).trimEnd());
    }

    return;
  }

  if (argDelimiter === ',') {
    // End of list item.
    // List item.
    let itemsRx: UcdRx;

    if (single || rx.lst?.()) {
      itemsRx = rx;
    } else {
      reader.error(ucdUnexpectedError('list', rx));
      itemsRx = UCD_OPAQUE_RX;
    }
    if (argStart) {
      // Decode leading item, if eny.
      // Ignore empty leading item otherwise.
      ucdDecodeValue(reader, itemsRx, reader.consume(argStart).trimEnd());
    }
    if (single) {
      // Do not parse the rest of items.
      return;
    }

    // Skip comma and whitespace after it.
    reader.consume(1);
    await ucdSkipWhitespace(reader);

    return await ucdReadItems(reader, itemsRx);
  }

  if (argDelimiter === '(') {
    // TODO: Map entry.
    return Promise.reject('TODO');
  }

  // New line.
  // Treat the rest of the item as string.
  ucdRxString(reader, rx, reader.consume(argStart + 1) + (await ucdReadRawString(reader)));
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

async function ucdReadNestedList(reader: UcdReader, rx: UcdRx): Promise<void> {
  let itemsRx = rx._.nls?.();

  if (!itemsRx) {
    reader.error(ucdUnexpectedError('list', rx));
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

const UCD_ARG_PATTERN = /[(),\r\n]/;

async function ucdSkipWhitespace(reader: UcdReader): Promise<void> {
  const nonSpaceStart = await reader.search(UCD_NON_SPACE_PATTERN);

  if (nonSpaceStart > 0) {
    // Some spaces found.
    reader.consume(nonSpaceStart);
  } else if (nonSpaceStart < 0) {
    // Only spaces left.
    reader.consume();
  }
}

const UCD_NON_SPACE_PATTERN = /\S/;
