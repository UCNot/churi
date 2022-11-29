import { ChURIArrayConsumer, ChURIObjectConsumer } from '../ch-uri-value-consumer.js';
import { URIChargeParser } from '../uri-charge-parser.js';
import { ChURIElementTarget, ChURIPropertyTarget, URIChargeTarget } from './uri-charge-target.js';

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
    // Start nested object and parse first property.
    const firstKey = to.decoder.decodeKey(input.slice(0, valueEnd));
    const firstValueOffset = valueEnd + 1;
    const objectConsumer = to.consumer.startObject();
    const objectEnd =
      firstValueOffset
      + parseURIChargeObject(to, firstKey, objectConsumer, input.slice(firstValueOffset));

    return { charge: objectConsumer.endObject(), end: objectEnd };
  }

  // Empty key. Start nested array and parse first element.

  const arrayConsumer = to.consumer.startArray();
  const arrayEnd = parseURIChargeArray(to, arrayConsumer, input.slice(1)) + 1;

  return { charge: arrayConsumer.endArray(), end: arrayEnd };
}

const PARENT_PATTERN = /[()]/;

function parseURIChargeObject<TValue>(
  parent: URIChargeTarget<TValue>,
  key: string,
  consumer: ChURIObjectConsumer<TValue>,
  firstValueInput: string,
): number {
  const to = new ChURIPropertyTarget(parent, key, consumer);

  // Opening parent after key.
  // Parse first property value.
  const firstValueEnd = parseURIChargeValue(to, firstValueInput).end + 1; // After closing parent.

  if (firstValueEnd >= firstValueInput.length) {
    // End of input.
    return firstValueInput.length;
  }
  if (firstValueInput[firstValueEnd] === ')') {
    return firstValueEnd;
  }

  // Parse the rest of the object properties.
  return firstValueEnd + parseURIChargeProperties(to, firstValueInput.slice(firstValueEnd));
}

function parseURIChargeProperties<TValue>(
  to: ChURIPropertyTarget<TValue>,
  input: string /* never empty */,
): number {
  let toArray: ChURIElementTarget<TValue> | undefined;
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      toArray?.endArray();
      to.forKey(to.decoder.decodeKey(input)).addSuffix();

      return offset + input.length;
    }

    if (keyEnd) {
      // New key specified explicitly.
      // Otherwise, the previous one reused. Thus, `key(value1)(value2)` is the same as `key(value1)key(value2)`.
      to = to.forKey(to.decoder.decodeKey(input.slice(0, keyEnd)));
      if (toArray) {
        // End preceding array.
        toArray.endArray();
        toArray = undefined;
      }
    }

    if (input[keyEnd] === ')') {
      toArray?.endArray();
      if (keyEnd) {
        to.addSuffix();
      }

      return offset + keyEnd;
    }
    if (!keyEnd && !toArray) {
      // Convert property to array if not converted yet, and continue appending to it.
      toArray = new ChURIElementTarget(to, to.startArray());
    }

    input = input.slice(keyEnd + 1);
    offset += keyEnd + 1;

    const nextKeyStart = parseURIChargeValue(toArray ?? to, input).end + 1;

    if (nextKeyStart >= input.length) {
      toArray?.endArray();

      return offset + input.length;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}

function parseURIChargeArray<TValue>(
  parent: URIChargeTarget<TValue>,
  consumer: ChURIArrayConsumer<TValue>,
  firstValueInput: string,
): number {
  const to = new ChURIElementTarget(parent, consumer);

  // Opening parent without preceding key.
  // Parse first element value.
  const firstValueEnd = parseURIChargeValue(to, firstValueInput).end + 1; // After closing parent.

  if (firstValueEnd >= firstValueInput.length) {
    // End of input.
    return firstValueInput.length;
  }
  if (firstValueInput[firstValueEnd] === ')') {
    // No more fields.
    return firstValueEnd;
  }

  // Parse the rest of array elements.
  return firstValueEnd + parseURIChargeElements(to, firstValueInput.slice(firstValueEnd));
}

function parseURIChargeElements<TValue>(
  to: ChURIElementTarget<TValue>,
  input: string /* never empty */,
): number {
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      // Suffix treated as trailing object element with suffix.
      // Thus, `(value)suffix` is the same as `(value)(suffix())`.
      const suffixConsumer = to.startObject();

      suffixConsumer.addSuffix(to.decoder.decodeKey(input));
      suffixConsumer.endObject();

      return offset + input.length;
    }

    if (keyEnd) {
      // New key specified explicitly.
      // Add trailing object element and pass the rest of the input there.
      // Thus, `(value1)key(value2)` is the same as `(value1)(key(value2))`.
      const key = to.decoder.decodeKey(input.slice(0, keyEnd));
      const firstValueOffset = keyEnd + 1;
      const objectConsumer = to.startObject();
      const objectEnd =
        offset
        + firstValueOffset
        + parseURIChargeObject(to, key, objectConsumer, input.slice(firstValueOffset));

      objectConsumer.endObject();

      return objectEnd;
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
