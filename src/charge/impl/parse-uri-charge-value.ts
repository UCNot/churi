import { ChURIListConsumer, ChURIMapConsumer } from '../ch-uri-value-consumer.js';
import { URIChargeParser } from '../uri-charge-parser.js';
import { ChURIListItemTarget, ChURIMapEntryTarget, URIChargeTarget } from './uri-charge-target.js';

export function parseURIChargeValue<TValue, TCharge>(
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
    return parseURIChargeMapOrDirective(to, input.slice(0, valueEnd), input);
  }

  // Empty key. Start nested list and parse first item.

  const listConsumer = to.consumer.startList();
  const listEnd = parseURIChargeList(to, listConsumer, input.slice(1)) + 1;

  return { charge: listConsumer.endList(), end: listEnd };
}

const PARENT_PATTERN = /[()]/;

function parseURIChargeMapOrDirective<TValue, TCharge>(
  to: URIChargeTarget<TValue, TCharge>,
  rawKey: string,
  input: string,
): URIChargeParser.Result<TCharge> {
  const firstValueOffset = rawKey.length + 1;
  const firstValueInput = input.slice(firstValueOffset);

  if (rawKey.startsWith('!')) {
    // Handle directive.
    const directiveConsumer = to.ext.startDirective(to, rawKey);
    const directiveEnd =
      firstValueOffset + parseURIChargeList(to, directiveConsumer, firstValueInput);

    return { charge: directiveConsumer.endList(), end: directiveEnd };
  }

  // Start nested map and parse first entry.
  const firstKey = to.decoder.decodeKey(rawKey);
  const mapConsumer = to.consumer.startMap();
  const mapEnd = firstValueOffset + parseURIChargeMap(to, firstKey, mapConsumer, firstValueInput);

  return { charge: mapConsumer.endMap(), end: mapEnd };
}

function parseURIChargeMap<TValue>(
  parent: URIChargeTarget<TValue>,
  key: string,
  consumer: ChURIMapConsumer<TValue>,
  firstValueInput: string,
): number {
  // Opening parent after key.

  const to = new ChURIMapEntryTarget(parent, key, consumer);

  // Parse first entry value.
  const firstValueEnd = parseURIChargeValue(to, firstValueInput).end + 1; // After closing parent.

  if (firstValueEnd >= firstValueInput.length) {
    // End of input.
    return firstValueInput.length;
  }
  if (firstValueInput[firstValueEnd] === ')') {
    return firstValueEnd;
  }

  // Parse the rest of the map entries.
  return firstValueEnd + parseURIChargeMapEntries(to, firstValueInput.slice(firstValueEnd));
}

function parseURIChargeMapEntries<TValue>(
  to: ChURIMapEntryTarget<TValue>,
  input: string /* never empty */,
): number {
  let toList: ChURIListItemTarget<TValue> | undefined;
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      toList?.endList();
      to.forKey(to.decoder.decodeKey(input)).addSuffix();

      return offset + input.length;
    }

    if (keyEnd) {
      // New key specified explicitly.
      // Otherwise, the previous one reused. Thus, `key(value1)(value2)` is the same as `key(value1)key(value2)`.
      to = to.forKey(to.decoder.decodeKey(input.slice(0, keyEnd)));
      if (toList) {
        // End the list value of preceding entry.
        toList.endList();
        toList = undefined;
      }
    }

    if (input[keyEnd] === ')') {
      toList?.endList();
      if (keyEnd) {
        to.addSuffix();
      }

      return offset + keyEnd;
    }
    if (!keyEnd && !toList) {
      // Convert entry value to list if not converted yet, and continue appending to it.
      toList = new ChURIListItemTarget(to, to.startList());
    }

    input = input.slice(keyEnd + 1);
    offset += keyEnd + 1;

    const nextKeyStart = parseURIChargeValue(toList ?? to, input).end + 1;

    if (nextKeyStart >= input.length) {
      toList?.endList();

      return offset + input.length;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}

function parseURIChargeList<TValue>(
  parent: URIChargeTarget<TValue>,
  consumer: ChURIListConsumer<TValue>,
  firstValueInput: string,
): number {
  const to = new ChURIListItemTarget(parent, consumer);

  // Opening parent without preceding key.
  // Parse first item value.
  const firstValueEnd = parseURIChargeValue(to, firstValueInput).end + 1; // After closing parent.

  if (firstValueEnd >= firstValueInput.length) {
    // End of input.
    return firstValueInput.length;
  }
  if (firstValueInput[firstValueEnd] === ')') {
    // No more fields.
    return firstValueEnd;
  }

  // Parse the rest of list items.
  return firstValueEnd + parseURIChargeListItems(to, firstValueInput.slice(firstValueEnd));
}

function parseURIChargeListItems<TValue>(
  to: ChURIListItemTarget<TValue>,
  input: string /* never empty */,
): number {
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      // Suffix treated as trailing item containing map with suffix.
      // Thus, `(value)suffix` is the same as `(value)(suffix())`.
      const suffixConsumer = to.startMap();

      suffixConsumer.addSuffix(to.decoder.decodeKey(input));
      suffixConsumer.endMap();

      return offset + input.length;
    }

    if (keyEnd) {
      // New key specified explicitly.
      // Add map to trailing item and pass the rest of the input to added map.
      // Thus, `(value1)key(value2)` is the same as `(value1)(key(value2))`.
      return offset + parseURIChargeMapOrDirective(to, input.slice(0, keyEnd), input).end;
    }

    if (input[0] === ')') {
      return offset;
    }

    input = input.slice(1);
    ++offset;

    const nextKeyStart = parseURIChargeValue(to, input).end + 1;

    if (nextKeyStart >= input.length) {
      return offset + input.length;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}
