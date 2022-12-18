import { decodeURIChargeKey } from '../uri-charge-codec.js';
import { URIChargeRx } from '../uri-charge-rx.js';
import { decodeUcDirectiveArg, decodeUcValue, UcValueDecoder } from './uc-value-decoder.js';
import { URIChargeExtParser } from './uri-charge-ext-parser.js';

export function parseUcValue<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  ext: URIChargeExtParser<TValue, TCharge>,
  decoder: UcValueDecoder,
  input: string,
): number {
  const valueEnd = input.search(PARENT_PATTERN);

  if (valueEnd < 0) {
    // Up to the end of input.
    decoder(rx, ext, input);

    return input.length;
  }
  if (input[valueEnd] === ')') {
    // Up to closing parent.
    decoder(rx, ext, input.slice(0, valueEnd));

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

function parseUcMapOrDirective<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  ext: URIChargeExtParser<TValue, TCharge>,
  rawKey: string,
  input: string,
): number {
  if (rawKey.startsWith('!')) {
    const emptyMapEnd = parseEmptyUcMap(rx, rawKey, input);

    if (emptyMapEnd) {
      return emptyMapEnd;
    }

    // Handle directive.
    const firstValueOffset = rawKey.length + 1;
    const firstValueInput = input.slice(firstValueOffset);
    let end!: number;

    ext.rxDirective(rx, rawKey, directiveRx => {
      end = firstValueOffset + parseUcDirective(directiveRx, ext, firstValueInput);

      return directiveRx.end();
    });

    return end;
  }

  // Start nested map and parse first entry.
  const firstValueOffset = rawKey.length + 1;
  const firstValueInput = input.slice(firstValueOffset);
  const firstKey = decodeURIChargeKey(rawKey);
  let end!: number;

  rx.rxMap(mapRx => {
    end = firstValueOffset + parseUcMap(mapRx, ext, firstKey, firstValueInput);

    return mapRx.endMap();
  });

  return end;
}

const EMPTY_MAP = '!())';

function parseEmptyUcMap<TValue, TCharge>(
  rx: URIChargeRx.ValueRx<TValue, TCharge>,
  rawKey: string,
  input: string,
): number | undefined {
  if (rawKey !== '!') {
    return;
  }

  const inputLength = input.length;
  let end: number;

  if (inputLength >= EMPTY_MAP.length) {
    if (!input.startsWith(EMPTY_MAP)) {
      return;
    }
    end = EMPTY_MAP.length;
  } else {
    if (!EMPTY_MAP.startsWith(input)) {
      return;
    }
    end = input.length;
  }

  rx.rxMap(mapRx => mapRx.endMap());

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
      mapRx.addSuffix(decodeURIChargeKey(input));

      return offset + input.length;
    }

    const key = decodeURIChargeKey(input.slice(0, keyEnd));

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
    const nextTokenStart = parseUcValue(rx, ext, decodeUcValue, input) + 1;

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
  return parseUcArgsWithDecoder(rx, ext, decodeUcValue, firstValueInput);
}

function parseUcDirective<TValue>(
  rx: URIChargeRx.ValueRx<TValue>,
  ext: URIChargeExtParser<TValue>,
  firstValueInput: string,
): number {
  return parseUcArgsWithDecoder(rx, ext, decodeUcDirectiveArg, firstValueInput);
}

function parseUcArgsWithDecoder<TValue>(
  rx: URIChargeRx.ValueRx<TValue>,
  ext: URIChargeExtParser<TValue>,
  decoder: UcValueDecoder,
  firstValueInput: string,
): number {
  // Opening parent without preceding key.
  // Parse first item value.
  const firstValueEnd = parseUcValue(rx, ext, decoder, firstValueInput) + 1;
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
  return (
    firstValueEnd
    + parseUcListOrDirectiveItems(rx, ext, decoder, firstValueInput.slice(firstValueEnd))
  );
}

function parseUcListOrDirectiveItems<TValue>(
  rx: URIChargeRx.ValueRx<TValue>,
  ext: URIChargeExtParser<TValue>,
  decoder: UcValueDecoder,
  input: string /* never empty */,
): number {
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      // Suffix treated as trailing item containing map with suffix.
      // Thus, `(value)suffix` is the same as `(value)(suffix())`.
      rx.rxMap(suffixRx => {
        suffixRx.addSuffix(decodeURIChargeKey(input));

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

    const nextKeyStart = parseUcValue(rx, ext, decoder, input) + 1;

    if (nextKeyStart >= input.length) {
      return offset + input.length;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}
