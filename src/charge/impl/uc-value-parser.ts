import { unchargeURIKey } from '../charge-uri.js';
import { URIChargeRx } from '../uri-charge-rx.js';
import { decodeUcValue } from './uc-value-decoder.js';
import { URIChargeExtParser } from './uri-charge-ext-parser.js';

export function parseUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  ext: URIChargeExtParser<TValue, TCharge>,
  input: string,
): number {
  if (input.startsWith("'")) {
    const rawString = parseRawUcStringLength(input.slice(1));

    rx.addValue(rawString, 'string');

    return 1 + rawString.length;
  }

  const valueEnd = input.search(PARENT_PATTERN);

  if (valueEnd < 0) {
    // Up to the end of input.
    decodeUcValue(rx, ext, input);

    return input.length;
  }
  if (input[valueEnd] === ')') {
    // Up to closing parent.
    decodeUcValue(rx, ext, input.slice(0, valueEnd));

    return valueEnd;
  }

  // Opening parent.
  if (valueEnd) {
    return parseUcMapOrDirective(rx, ext, input.slice(0, valueEnd), input);
  }

  // Empty key. Start nested list and parse first item.
  let end!: number;

  rx.rxList(listRx => {
    end = parseUcArgs(listRx, ext, input.slice(1)) + 1;

    return listRx.end();
  });

  return end;
}

const PARENT_PATTERN = /[()]/;

function parseRawUcStringLength(input: string): string {
  let openedParentheses = 0;
  let offset = 0;

  for (;;) {
    const restInput = input.slice(offset);
    const parenthesisIdx = restInput.search(PARENT_PATTERN);

    if (parenthesisIdx < 0) {
      return input;
    }

    if (restInput[parenthesisIdx] === '(') {
      // End of input.
      offset += parenthesisIdx + 1;
      ++openedParentheses;
    } else if (openedParentheses) {
      // Closing parenthesis matches the opened one.
      --openedParentheses;
      offset += parenthesisIdx + 1;
    } else {
      // Closing parenthesis does not match the opening one.
      return input.slice(0, offset + parenthesisIdx);
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
    const arg = parseRawUcStringLength(input.slice(rawKey.length));

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
    firstEntryEnd = parseUcMapEntry(rx, ext, firstValueInput);

    return rx.end();
  });

  // After closing parent.
  if (firstEntryEnd >= firstValueInput.length) {
    // End of input.
    return firstValueInput.length;
  }
  if (firstValueInput[firstEntryEnd] === ')') {
    return firstEntryEnd;
  }

  // Parse the rest of the map entries.
  return firstEntryEnd + parseUcMapEntries(mapRx, ext, firstValueInput.slice(firstEntryEnd));
}

function parseUcMapEntries<TValue>(
  mapRx: URIChargeRx.MapRx<TValue>,
  ext: URIChargeExtParser<TValue>,
  input: string /* never empty */,
): number {
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      mapRx.addSuffix(unchargeURIKey(input));

      return offset + input.length;
    }

    const key = unchargeURIKey(input.slice(0, keyEnd));

    if (input[keyEnd] === ')') {
      if (keyEnd) {
        mapRx.addSuffix(key);
      }

      return offset + keyEnd;
    }

    let nextKeyStart!: number;

    input = input.slice(keyEnd + 1);
    offset += keyEnd + 1;
    mapRx.rxEntry(key, rx => {
      nextKeyStart = parseUcMapEntry(rx, ext, input);

      return rx.end();
    });

    if (nextKeyStart >= input.length) {
      return offset + input.length;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}

function parseUcMapEntry<TValue>(
  rx: URIChargeRx.ValueRx<TValue>,
  ext: URIChargeExtParser<TValue>,
  input: string,
): number {
  let offset = 0;

  for (;;) {
    const nextTokenStart = parseUcValue(rx, ext, input) + 1;

    if (nextTokenStart >= input.length) {
      return offset + input.length;
    }
    if (input[nextTokenStart] !== '(') {
      // Not a next item.
      return offset + nextTokenStart;
    }

    input = input.slice(nextTokenStart + 1);
    offset += nextTokenStart + 1;
  }
}

export function parseUcArgs<TValue>(
  rx: URIChargeRx.ValueRx<TValue>,
  ext: URIChargeExtParser<TValue>,
  firstValueInput: string,
): number {
  // Opening parent without preceding key.
  // Parse first item value.
  const firstValueEnd = parseUcValue(rx, ext, firstValueInput) + 1;
  // After closing parent.

  if (firstValueEnd >= firstValueInput.length) {
    // End of input.
    return firstValueInput.length;
  }
  if (firstValueInput[firstValueEnd] === ')') {
    // No more fields.
    return firstValueEnd;
  }

  // Parse the rest of list items.
  return firstValueEnd + parseUcListOrDirectiveItems(rx, ext, firstValueInput.slice(firstValueEnd));
}

function parseUcListOrDirectiveItems<TValue>(
  rx: URIChargeRx.ValueRx<TValue>,
  ext: URIChargeExtParser<TValue>,
  input: string /* never empty */,
): number {
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      // Suffix treated as trailing item containing map with suffix.
      // Thus, `(value)suffix` is the same as `(value)(suffix())`.
      rx.rxMap(suffixRx => {
        suffixRx.addSuffix(unchargeURIKey(input));

        return suffixRx.endMap();
      });

      return offset + input.length;
    }

    if (keyEnd) {
      // New key specified explicitly.
      // Add map to trailing item and pass the rest of the input to added map.
      // Thus, `(value1)key(value2)` is the same as `(value1)(key(value2))`.
      return offset + parseUcMapOrDirective(rx, ext, input.slice(0, keyEnd), input);
    }

    if (input[0] === ')') {
      return offset;
    }

    input = input.slice(1);
    ++offset;

    const nextKeyStart = parseUcValue(rx, ext, input) + 1;

    if (nextKeyStart >= input.length) {
      return offset + input.length;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}
