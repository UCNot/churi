import { URIChargeParser } from '../uri-charge-parser.js';
import { URIChargeRx } from '../uri-charge-rx.js';
import { ChURIItemTarget, ChURIMapEntryTarget, URIChargeTarget } from './uri-charge-target.js';

export function parseChURIValue<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  input: string,
): URIChargeParser.Result<TCharge> {
  const valueEnd = input.search(PARENT_PATTERN);

  if (valueEnd < 0) {
    // Up to the end of input.
    return { charge: to.decode(input), end: input.length };
  }
  if (input[valueEnd] === ')') {
    // Up to closing parent.
    return { charge: to.decode(input.slice(0, valueEnd)), end: valueEnd };
  }

  // Opening parent.
  if (valueEnd) {
    return parseChURIMapOrDirective(to, input.slice(0, valueEnd), input);
  }

  // Empty key. Start nested list and parse first item.

  let end!: number;
  const charge = to.rx.rxList(listRx => {
    end = parseChURIList(to as URIChargeTarget<TValue>, listRx, input.slice(1)) + 1;

    return listRx.endList();
  });

  return { charge, end };
}

const PARENT_PATTERN = /[()]/;

function parseChURIMapOrDirective<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rawKey: string,
  input: string,
): URIChargeParser.Result<TCharge> {
  if (rawKey.startsWith('!')) {
    const emptyMap = parseChURIEmptyMap(to, rawKey, input);

    if (emptyMap) {
      return emptyMap;
    }

    // Handle directive.
    const firstValueOffset = rawKey.length + 1;
    const firstValueInput = input.slice(firstValueOffset);
    let end!: number;
    const charge = to.ext.rxDirective(to, rawKey, directiveRx => {
      end =
        firstValueOffset
        + parseChURIDirective(to as URIChargeTarget<TValue>, directiveRx, firstValueInput);

      return directiveRx.endDirective();
    });

    return { charge, end };
  }

  // Start nested map and parse first entry.
  const firstValueOffset = rawKey.length + 1;
  const firstValueInput = input.slice(firstValueOffset);
  const firstKey = to.decoder.decodeKey(rawKey);
  let end!: number;
  const charge = to.rx.rxMap(mapRx => {
    end =
      firstValueOffset
      + parseChURIMap(to as URIChargeTarget<TValue>, firstKey, mapRx, firstValueInput);

    return mapRx.endMap();
  });

  return { charge, end };
}

const EMPTY_MAP = '!())';

function parseChURIEmptyMap<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
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

  return { charge: to.rx.rxMap(mapRx => mapRx.endMap()), end };
}

function parseChURIMap<TValue>(
  parent: URIChargeTarget<TValue>,
  key: string,
  mapRx: URIChargeRx.MapRx<TValue>,
  firstValueInput: string,
): number {
  // Opening parent after key.

  const to = new ChURIMapEntryTarget(parent, key, mapRx);

  // Parse first entry value.
  const firstValueEnd = parseChURIValue(to, firstValueInput).end + 1; // After closing parent.

  if (firstValueEnd >= firstValueInput.length) {
    // End of input.
    return firstValueInput.length;
  }
  if (firstValueInput[firstValueEnd] === ')') {
    return firstValueEnd;
  }

  // Parse the rest of the map entries.
  return firstValueEnd + parseChURIMapEntries(to, firstValueInput.slice(firstValueEnd));
}

function parseChURIMapEntries<TValue>(
  to: ChURIMapEntryTarget<TValue>,
  input: string /* never empty */,
): number {
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      to.forKey(to.decoder.decodeKey(input)).addSuffix();

      return offset + input.length;
    }

    if (keyEnd) {
      // New key specified explicitly.
      // Otherwise, the previous one reused. Thus, `key(value1)(value2)` is the same as `key(value1)key(value2)`.
      to = to.forKey(to.decoder.decodeKey(input.slice(0, keyEnd)));
    }
    if (input[keyEnd] === ')') {
      if (keyEnd) {
        to.addSuffix();
      }

      return offset + keyEnd;
    }

    let nextKeyStart!: number;

    if (!keyEnd) {
      // Convert entry value to list if not converted yet, and continue appending to it.
      to.rxList(rx => {
        nextKeyStart = parseChURIMapEntryItems(new ChURIItemTarget(to, rx), input);

        return rx.endList();
      });
    } else {
      input = input.slice(keyEnd + 1);
      offset += keyEnd + 1;
      nextKeyStart = parseChURIValue(to, input).end + 1;
    }

    if (nextKeyStart >= input.length) {
      return offset + input.length;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}

function parseChURIMapEntryItems<TValue>(
  to: ChURIItemTarget<TValue>,
  input: string /* never empty */,
): number {
  let offset = 0;

  for (;;) {
    input = input.slice(1);
    ++offset;

    const nextTokenStart = parseChURIValue(to, input).end + 1;

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
  parent: URIChargeTarget<TValue>,
  listRx: URIChargeRx.ListRx<TValue>,
  firstValueInput: string,
): number {
  return parseChURIListOrDirective(new ChURIItemTarget(parent, listRx), firstValueInput);
}

function parseChURIDirective<TValue>(
  parent: URIChargeTarget<TValue>,
  directiveRx: URIChargeRx.DirectiveRx<TValue>,
  firstValueInput: string,
): number {
  return parseChURIListOrDirective(new ChURIItemTarget(parent, directiveRx), firstValueInput);
}

function parseChURIListOrDirective<TValue>(
  to: ChURIItemTarget<TValue>,
  firstValueInput: string,
): number {
  // Opening parent without preceding key.
  // Parse first item value.
  const firstValueEnd = parseChURIValue(to, firstValueInput).end + 1; // After closing parent.

  if (firstValueEnd >= firstValueInput.length) {
    // End of input.
    return firstValueInput.length;
  }
  if (firstValueInput[firstValueEnd] === ')') {
    // No more fields.
    return firstValueEnd;
  }

  // Parse the rest of list items.
  return firstValueEnd + parseChURIListItems(to, firstValueInput.slice(firstValueEnd));
}

function parseChURIListItems<TValue>(
  to: ChURIItemTarget<TValue>,
  input: string /* never empty */,
): number {
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      // Suffix treated as trailing item containing map with suffix.
      // Thus, `(value)suffix` is the same as `(value)(suffix())`.
      to.rxMap(suffixRx => {
        suffixRx.addSuffix(to.decoder.decodeKey(input));

        return suffixRx.endMap();
      });

      return offset + input.length;
    }

    if (keyEnd) {
      // New key specified explicitly.
      // Add map to trailing item and pass the rest of the input to added map.
      // Thus, `(value1)key(value2)` is the same as `(value1)(key(value2))`.
      return offset + parseChURIMapOrDirective(to, input.slice(0, keyEnd), input).end;
    }

    if (input[0] === ')') {
      return offset;
    }

    input = input.slice(1);
    ++offset;

    const nextKeyStart = parseChURIValue(to, input).end + 1;

    if (nextKeyStart >= input.length) {
      return offset + input.length;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}
