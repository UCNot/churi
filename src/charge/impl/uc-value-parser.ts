import { ASCIICharSet } from '../../impl/ascii-char-set.js';
import { unchargeURIKey } from '../charge-uri.js';
import { URIChargeRx } from '../uri-charge-rx.js';
import { decodeUcValue } from './uc-value-decoder.js';
import { URIChargeExtParser } from './uri-charge-ext-parser.js';

export function parseUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): number {
  if (input.startsWith(',')) {
    // Convert to list and ignore leading comma.
    rx.asList();

    if (input.length < 2) {
      // Ignore trailing comma at the end of input,
      return input.length;
    }
    if (input[1] === ')') {
      // Ignore trailing comma before closing parenthesis.
      return 1;
    }

    return 1 + parseUcSingleOrList(rx, ext, input.slice(1));
  }

  return parseUcSingleOrList(rx, ext, input);
}

function parseUcSingleOrList<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): number {
  const end = parseUcSingle(rx, ext, input);

  if (end >= input.length) {
    // End of input after the only item.
    return input.length;
  }

  const terminator = input[end];

  if (terminator === ')') {
    // Closing parenthesis ends the value.
    return end;
  }

  rx.asList(); // Convert to list.

  // Skip comma, if any.
  const restItemsStart = terminator === ',' ? end + 1 : end;

  // Parse the rest of list items.
  return restItemsStart + parseUcItems(rx, ext, input.slice(restItemsStart));
}

function parseUcSingle<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): number {
  if (input.startsWith("'")) {
    // Parse quoted string.
    const rawString = parseRawUcString(input.slice(1));

    rx.addValue(rawString, 'string');

    return 1 + rawString.length;
  }

  const delimiterIdx = input.search(UC_DELIMITER_PATTERN);

  if (delimiterIdx < 0) {
    // Up to the end of input.
    decodeUcValue(rx, ext, input);

    return input.length;
  }

  const delimiter = input[delimiterIdx];

  if (delimiter !== '(') {
    // End of the value.
    decodeUcValue(rx, ext, input.slice(0, delimiterIdx));

    return delimiterIdx;
  }
  if (delimiterIdx) {
    // Opening parent after the key.
    return parseUcMapOrDirective(rx, ext, input.slice(0, delimiterIdx), input);
  }

  // Opening parent without preceding key treated as nested list.
  return parseNestedUcList(rx, ext, input);
}

const UC_PARENTHESIS_PATTERN = /[()]/;
const UC_DELIMITER_PATTERN = /[(),]/;

function parseRawUcString(input: string, balanceParentheses = false): string {
  let openedParentheses = 0;
  let offset = 0;

  for (;;) {
    const restInput = input.slice(offset);
    const delimiterIdx = restInput.search(
      // Search for commas only _outside_ parentheses.
      openedParentheses ? UC_PARENTHESIS_PATTERN : UC_DELIMITER_PATTERN,
    );

    if (delimiterIdx < 0) {
      // No delimiters found.
      // Accept _full_ input.

      return balanceParentheses && openedParentheses
        ? input + ')'.repeat(openedParentheses) // Close hanging parentheses.
        : input;
    }

    if (restInput[delimiterIdx] === '(') {
      // Open one more parenthesis.
      offset += delimiterIdx + 1;
      ++openedParentheses;
    } else if (openedParentheses) {
      // Closing parenthesis matching the opened one.
      // This can not be a comma, as they are not searched for _inside_ parenthesis.
      --openedParentheses;
      offset += delimiterIdx + 1;
    } else {
      // Either closing parenthesis not matching the opening one, or a comma.
      // In either case, this is the end of input.
      return input.slice(0, offset + delimiterIdx);
    }
  }
}

function parseNestedUcList<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): number {
  rx.asList();

  if (input.length < 2 || input[1] === ')') {
    // Empty list.
    rx.rxList(itemRx => itemRx.end());

    return Math.min(input.length, 2);
  }

  // Ignore leading comma, if any.
  const offset = input[1] === ',' ? 2 : 1;
  let end!: number;

  rx.rxList(itemRx => {
    end = offset + parseUcItems(itemRx, ext, input.slice(offset)) + 1;

    return itemRx.end();
  });

  return end;
}

function parseUcItems<TValue, TCharge>(
  listRx: URIChargeRx.ValueRx<TValue, TCharge>,
  ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): number {
  let offset = 0;

  for (;;) {
    if (input.length <= offset || input[offset] === ')') {
      // Ignore empty trailing item.
      return offset;
    }

    const restInput = input.slice(offset);
    const end = parseUcSingle(listRx, ext, restInput);

    if (end >= restInput.length) {
      // The end of the input.
      return input.length;
    }

    const delimiter = restInput[end];

    if (delimiter === ')') {
      // Closing parenthesis ends the list.
      return offset + end;
    }
    if (delimiter === ',') {
      // Comma separator.
      offset += end + 1;
    } else {
      // No comma separator.
      // This is possible e.g. after nested list.
      offset += end;
    }
  }
}

function parseUcMapOrDirective<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  ext: URIChargeExtParser<TValue, TCharge>,
  rawKey: string,
  input: string,
): number {
  if (rawKey.startsWith('!')) {
    // Handle directive.
    const arg = parseRawUcString(input.slice(rawKey.length), true);

    ext.parseDirective(rx, rawKey, arg);

    return rawKey.length + arg.length;
  }

  // Start nested map and parse first entry.
  const firstValueOffset = rawKey.length + 1;
  const firstValueInput = input.slice(firstValueOffset);
  const firstKey = unchargeURIKey(rawKey);
  let end!: number;

  rx.rxMap(mapRx => {
    end = firstValueOffset + parseUcMap(mapRx, ext, firstKey, firstValueInput);

    return mapRx.endMap();
  });

  return end;
}

function parseUcMap<TValue>(
  mapRx: URIChargeRx.MapRx<TValue>,
  ext: URIChargeExtParser<TValue>,
  key: string,
  firstValueInput: string,
): number {
  // Opening parent after key.
  // Parse first entry value.
  let firstEntryEnd!: number;

  mapRx.rxEntry(key, rx => {
    firstEntryEnd = parseUcValue(rx, ext, firstValueInput) + 1;

    return rx.end();
  });

  // After closing parent.
  if (firstEntryEnd >= firstValueInput.length) {
    // End of input.
    return firstValueInput.length;
  }
  if (UC_MAP_TERMINATORS.has(firstValueInput.charCodeAt(firstEntryEnd))) {
    // Next item starts after closing parenthesis.
    return firstEntryEnd;
  }

  // Parse the rest of the map entries.
  return firstEntryEnd + parseUcEntries(mapRx, ext, firstValueInput.slice(firstEntryEnd));
}

const UC_MAP_TERMINATORS = new ASCIICharSet("!'(),");

function parseUcEntries<TValue>(
  mapRx: URIChargeRx.MapRx<TValue>,
  ext: URIChargeExtParser<TValue>,
  input: string /* never empty */,
): number {
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(UC_DELIMITER_PATTERN);

    if (keyEnd < 0) {
      // End of input.
      mapRx.addSuffix(unchargeURIKey(input));

      return offset + input.length;
    }

    const key = unchargeURIKey(input.slice(0, keyEnd));

    if (input[keyEnd] !== '(') {
      // No opening parent after key.
      if (keyEnd) {
        // ...but there is a key.
        // Add suffix.
        mapRx.addSuffix(key);
      }

      return offset + keyEnd;
    }

    let nextKeyStart!: number;

    input = input.slice(keyEnd + 1);
    offset += keyEnd + 1;
    mapRx.rxEntry(key, rx => {
      nextKeyStart = parseUcValue(rx, ext, input) + 1;

      return rx.end();
    });

    if (nextKeyStart >= input.length) {
      // End of input.
      return offset + input.length;
    }
    if (UC_MAP_TERMINATORS.has(input.charCodeAt(nextKeyStart))) {
      // Not a valid entry key.
      return offset + nextKeyStart;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}
