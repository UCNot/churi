import { UcdReader } from '../ucd-reader.js';
import { UcdRx } from '../ucd-rx.js';
import { ucdDecodeValue, ucdRxString } from './ucd-decode-value.js';
import { ucdUnexpectedError } from './ucd-errors.js';

export async function ucdReadValue(reader: UcdReader, rx: UcdRx, single = false): Promise<void> {
  await ucdSkipSpace(reader);

  const { current } = reader;

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
  }
  if (current.startsWith("'")) {
    reader.consume(1); // Skip apostrophe.

    ucdRxString(reader, rx, await ucdReadRawString(reader));

    if (single) {
      return;
    }
  }

  const argStart = await reader.search(UCD_ARG_PATTERN);

  if (argStart < 0) {
    // No arg found or end of input.
    // Consume the rest of the input.
    return ucdDecodeValue(reader, rx, reader.consume());
  }

  const argDelimiter = reader.current![argStart];

  if (argDelimiter === ')') {
    // Unbalanced closing parenthesis.
    // Consume up to its position.
    return ucdDecodeValue(reader, rx, reader.consume(argStart));
  }

  if (argDelimiter === ',') {
    if (single) {
      // Do not parse the list.
      return;
    }

    // List item.
    if (!rx.lst?.()) {
      reader.error(ucdUnexpectedError('list', rx));
    }
    if (argStart) {
      // Decode leading item, if eny.
      // Ignore empty leading item otherwise.
      ucdDecodeValue(reader, rx, reader.consume(argStart));
    }

    // Consume comma.
    reader.consume(1);
    await ucdSkipSpace(reader);

    return await ucdReadItems(reader, rx);
  }
}

async function ucdReadEntityOrTrue(_reader: UcdReader, _rx: UcdRx): Promise<void> {
  // TODO read entity or true.
  await Promise.reject('TODO');
}

async function ucdReadRawString(_reader: UcdReader, _balanceParentheses = false): Promise<string> {
  // TODO read raw string.
  return await Promise.reject('TODO');
}

async function ucdReadItems(_reader: UcdReader, _rx: UcdRx): Promise<void> {
  // TODO read list items.
  await Promise.reject('TODO');
}

const UCD_ARG_PATTERN = /[(),\r\n]/;

async function ucdSkipSpace(reader: UcdReader): Promise<void> {
  const nonSpaceStart = await reader.search(UCD_NON_SPACE_PATTERN);

  if (nonSpaceStart > 0) {
    reader.consume(nonSpaceStart);
  }
}

const UCD_NON_SPACE_PATTERN = /[^\r\n\t ]/;
