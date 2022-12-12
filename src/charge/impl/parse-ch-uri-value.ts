import { decodeURIChargeKey } from '../uri-charge-codec.js';
import { URIChargeParser } from '../uri-charge-parser.js';
import { URIChargeRx } from '../uri-charge-rx.js';
import {
  ChURIValueDecoder,
  decodeChURIDirectiveArg,
  decodeChURIValue,
} from './ch-uri-value-decoder.js';
import {
  AnyURIChargeRx,
  URIChargeEntryTarget,
  URIChargeItemTarget,
  URIChargeTarget,
} from './uri-charge-target.js';

export function parseChURIValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  decoder: ChURIValueDecoder,
  input: string,
): URIChargeParser.Result<TCharge> {
  const valueEnd = input.search(PARENT_PATTERN);

  if (valueEnd < 0) {
    // Up to the end of input.
    return { charge: decoder(to, rx, key, input), end: input.length };
  }
  if (input[valueEnd] === ')') {
    // Up to closing parent.
    return {
      charge: decoder(to, rx, key, input.slice(0, valueEnd)),
      end: valueEnd,
    };
  }

  // Opening parent.
  if (valueEnd) {
    return parseChURIMapOrDirective(to, rx, key, input.slice(0, valueEnd), input);
  }

  // Empty key. Start nested list and parse first item.

  let end!: number;
  const charge = to.rxList(rx, key, listRx => {
    end = parseChURIList(to.ext.itemTarget, listRx, input.slice(1)) + 1;

    return listRx.endList();
  });

  return { charge, end };
}

const PARENT_PATTERN = /[()]/;

function parseChURIMapOrDirective<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  rawKey: string,
  input: string,
): URIChargeParser.Result<TCharge> {
  if (rawKey.startsWith('!')) {
    const emptyMap = parseChURIEmptyMap(to, rx, key, rawKey, input);

    if (emptyMap) {
      return emptyMap;
    }

    // Handle directive.
    const firstValueOffset = rawKey.length + 1;
    const firstValueInput = input.slice(firstValueOffset);
    let end!: number;
    const charge = to.rxDirective(rx, key, rawKey, directiveRx => {
      end = firstValueOffset + parseChURIDirective(to.ext.itemTarget, directiveRx, firstValueInput);

      return directiveRx.endDirective();
    });

    return { charge, end };
  }

  // Start nested map and parse first entry.
  const firstValueOffset = rawKey.length + 1;
  const firstValueInput = input.slice(firstValueOffset);
  const firstKey = decodeURIChargeKey(rawKey);
  let end!: number;
  const charge = to.rxMap(rx, key, mapRx => {
    end = firstValueOffset + parseChURIMap(to.ext.entryTarget, mapRx, firstKey, firstValueInput);

    return mapRx.endMap();
  });

  return { charge, end };
}

const EMPTY_MAP = '!())';

function parseChURIEmptyMap<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rx: AnyURIChargeRx<TValue, TCharge>,
  key: string,
  rawKey: string,
  input: string,
): URIChargeParser.Result<TCharge> | undefined {
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

  return { charge: to.rxMap(rx, key, mapRx => mapRx.endMap()), end };
}

function parseChURIMap<TValue>(
  to: URIChargeEntryTarget<TValue>,
  rx: URIChargeRx.MapRx<TValue>,
  key: string,
  firstValueInput: string,
): number {
  // Opening parent after key.
  // Parse first entry value.
  const firstValueEnd = parseChURIValue(to, rx, key, decodeChURIValue, firstValueInput).end + 1;
  // After closing parent.

  if (firstValueEnd >= firstValueInput.length) {
    // End of input.
    return firstValueInput.length;
  }
  if (firstValueInput[firstValueEnd] === ')') {
    return firstValueEnd;
  }

  // Parse the rest of the map entries.
  return firstValueEnd + parseChURIMapEntries(to, rx, key, firstValueInput.slice(firstValueEnd));
}

function parseChURIMapEntries<TValue>(
  to: URIChargeEntryTarget<TValue>,
  rx: URIChargeRx.MapRx<TValue>,
  key: string,
  input: string /* never empty */,
): number {
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      rx.addSuffix(decodeURIChargeKey(input));

      return offset + input.length;
    }
    if (keyEnd) {
      // New key specified explicitly.
      // Otherwise, the previous one reused. Thus, `key(value1)(value2)` is the same as `key(value1)key(value2)`.
      key = decodeURIChargeKey(input.slice(0, keyEnd));
    }
    if (input[keyEnd] === ')') {
      if (keyEnd) {
        rx.addSuffix(key);
      }

      return offset + keyEnd;
    }

    let nextKeyStart!: number;

    if (!keyEnd) {
      // Convert entry value to list if not converted yet, and continue appending to it.
      to.rxList(rx, key, listRx => {
        nextKeyStart = parseChURIMapEntryItems(to.ext.itemTarget, listRx, input);

        return listRx.endList();
      });
    } else {
      input = input.slice(keyEnd + 1);
      offset += keyEnd + 1;
      nextKeyStart = parseChURIValue(to, rx, key, decodeChURIValue, input).end + 1;
    }

    if (nextKeyStart >= input.length) {
      return offset + input.length;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}

function parseChURIMapEntryItems<TValue>(
  to: URIChargeItemTarget<TValue>,
  rx: URIChargeRx.ItemsRx<TValue>,
  input: string /* never empty */,
): number {
  let offset = 0;

  for (;;) {
    input = input.slice(1);
    ++offset;

    const nextTokenStart = parseChURIValue(to, rx, '', decodeChURIValue, input).end + 1;

    if (nextTokenStart >= input.length) {
      return offset + input.length;
    }

    if (input[nextTokenStart] !== '(') {
      // Not a next item.
      return offset + nextTokenStart;
    }

    input = input.slice(nextTokenStart);
    offset += nextTokenStart;
  }
}

function parseChURIList<TValue>(
  to: URIChargeItemTarget<TValue>,
  rx: URIChargeRx.ListRx<TValue>,
  firstValueInput: string,
): number {
  return parseChURIListOrDirective(to, rx, decodeChURIValue, firstValueInput);
}

function parseChURIDirective<TValue>(
  to: URIChargeItemTarget<TValue>,
  rx: URIChargeRx.DirectiveRx<TValue>,
  firstValueInput: string,
): number {
  return parseChURIListOrDirective(to, rx, decodeChURIDirectiveArg, firstValueInput);
}

function parseChURIListOrDirective<TValue>(
  to: URIChargeItemTarget<TValue>,
  rx: URIChargeRx.ItemsRx<TValue>,
  decoder: ChURIValueDecoder,
  firstValueInput: string,
): number {
  // Opening parent without preceding key.
  // Parse first item value.
  const firstValueEnd = parseChURIValue(to, rx, '', decoder, firstValueInput).end + 1;
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
    + parseChURIListOrDirectiveItems(to, rx, decoder, firstValueInput.slice(firstValueEnd))
  );
}

function parseChURIListOrDirectiveItems<TValue>(
  to: URIChargeItemTarget<TValue>,
  rx: URIChargeRx.ItemsRx<TValue>,
  decoder: ChURIValueDecoder,
  input: string /* never empty */,
): number {
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      // Suffix treated as trailing item containing map with suffix.
      // Thus, `(value)suffix` is the same as `(value)(suffix())`.
      to.rxMap(rx, '', suffixRx => {
        suffixRx.addSuffix(decodeURIChargeKey(input));

        return suffixRx.endMap();
      });

      return offset + input.length;
    }

    if (keyEnd) {
      // New key specified explicitly.
      // Add map to trailing item and pass the rest of the input to added map.
      // Thus, `(value1)key(value2)` is the same as `(value1)(key(value2))`.
      return offset + parseChURIMapOrDirective(to, rx, '', input.slice(0, keyEnd), input).end;
    }

    if (input[0] === ')') {
      return offset;
    }

    input = input.slice(1);
    ++offset;

    const nextKeyStart = parseChURIValue(to, rx, '', decoder, input).end + 1;

    if (nextKeyStart >= input.length) {
      return offset + input.length;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}
