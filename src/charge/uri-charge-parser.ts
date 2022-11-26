import { asis } from '@proc7ts/primitives';
import { ChURIArrayBuilder } from './ch-uri-array-builder.js';
import { ChURIArrayConsumer } from './ch-uri-array-consumer.js';
import { ChURIObjectBuilder } from './ch-uri-object-builder.js';
import { ChURIObjectConsumer } from './ch-uri-object-consumer.js';
import { ChURIArray, ChURIObject, ChURIValue } from './ch-uri-value.js';
import { URIChargeConsumer } from './uri-charge-consumer.js';

let URIChargeParser$default: URIChargeParser | undefined;

export class URIChargeParser<out T = ChURIValue> {

  static get default(): URIChargeParser {
    return (URIChargeParser$default ??= new URIChargeParser());
  }

  static get<T>(options: URIChargeParser.Options<T>): URIChargeParser<T>;

  static get(options?: URIChargeParser.Options.WithoutConsumer): URIChargeParser;

  static get<T>(options?: URIChargeParser.Options<T>): URIChargeParser<T> {
    return options
      ? new URIChargeParser(options as URIChargeParser.Options.WithConsumer<T>)
      : (URIChargeParser.default as URIChargeParser<T>);
  }

  readonly #consumer: URIChargeConsumer<T>;

  constructor(
    ...options: ChURIValue extends T
      ? [URIChargeParser.Options<T>?]
      : [URIChargeParser.Options.WithConsumer<T>]
  );

  constructor(options?: URIChargeParser.Options<T>) {
    this.#consumer = options?.consumer ?? (URIChargeValueBuilder$instance as URIChargeConsumer<T>);
  }

  parse(input: string): URIChargeParser.Result<T> {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      return {
        charge: this.#consumer.setString(decodeURIComponent(input)),
        end: input.length,
      };
    }

    if (input[keyEnd] === ')') {
      // String charge.
      return {
        charge: this.#consumer.setString(decodeURIComponent(input.slice(0, keyEnd))),
        end: keyEnd,
      };
    }

    if (keyEnd) {
      // Object charge.
      const firstValueOffset = keyEnd + 1;
      const consumer = this.#consumer.startObject();
      const end =
        firstValueOffset
        + parseURIChargeObject(
          { key: decodeURIComponent(input.slice(0, keyEnd)), consumer },
          input.slice(firstValueOffset),
        );

      return {
        end,
        charge: consumer.endObject(),
      };
    }

    // Array charge.
    const consumer = this.#consumer.startArray();
    const end = 1 + parseURIChargeArray({ consumer }, input.slice(1));

    return {
      end,
      charge: consumer.endArray(),
    };
  }

}

export namespace URIChargeParser {
  export type Options<T> = Options.WithConsumer<T> | Options.WithoutConsumer;
  export namespace Options {
    export interface Base<T> {
      readonly consumer?: URIChargeConsumer<T> | undefined;
    }
    export interface WithConsumer<T> extends Base<T> {
      readonly consumer: URIChargeConsumer<T>;
    }
    export interface WithoutConsumer extends Base<never> {
      readonly consumer?: undefined;
    }
  }
  export interface Result<out T = ChURIValue> {
    readonly charge: T;
    readonly end: number;
  }
}

class URIChargeValueBuilder implements URIChargeConsumer<ChURIValue> {

  setString(value: string): string {
    return value;
  }

  startObject(): ChURIObjectConsumer<ChURIObject> {
    return new ChURIObjectBuilder();
  }

  startArray(): ChURIArrayConsumer<ChURIArray> {
    return new ChURIArrayBuilder();
  }

}

const URIChargeValueBuilder$instance = /*#__PURE__*/ new URIChargeValueBuilder();

const PARENT_PATTERN = /[()]/;

function parseURIChargeObject(to: URIChargeTarget$Property, firstValueInput: string): number {
  // Opening parent after key.
  // Parse first property value.
  const firstValueEnd = parseURIChargeValue(to, firstValueInput) + 1; // After closing parent.

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

function parseURIChargeProperties(
  { key, consumer }: URIChargeTarget$Property,
  input: string /* never empty */,
): number {
  let toArray: URIChargeTarget$Array | undefined;
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      toArray?.consumer.endArray();
      consumer.addSuffix(decodeURIComponent(input));

      return offset + input.length;
    }

    if (keyEnd) {
      // New key specified explicitly.
      // Otherwise, the previous one reused. Thus, `key(value1)(value2)` is the same as `key(value1)key(value2)`.
      key = decodeURIComponent(input.slice(0, keyEnd));
      if (toArray) {
        // End preceding array.
        toArray.consumer.endArray();
        toArray = undefined;
      }
    }

    if (input[keyEnd] === ')') {
      toArray?.consumer.endArray();
      if (keyEnd) {
        consumer.addSuffix(key);
      }

      return offset + keyEnd;
    }
    if (!keyEnd && !toArray) {
      // Convert property to array if not converted yet, and continue appending to it.
      toArray = { consumer: consumer.startArray(key) };
    }

    input = input.slice(keyEnd + 1);
    offset += keyEnd + 1;

    const nextKeyStart = parseURIChargeValue(toArray ?? { key, consumer }, input) + 1;

    if (nextKeyStart >= input.length) {
      toArray?.consumer.endArray();

      return offset + input.length;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}

function parseURIChargeArray(to: URIChargeTarget$Array, firstValueInput: string): number {
  // Opening parent without preceding key.
  // Parse first element value.
  const firstValueEnd = parseURIChargeValue(to, firstValueInput) + 1; // After closing parent.

  if (firstValueEnd >= firstValueInput.length) {
    // End of input.
    return firstValueInput.length;
  }
  if (firstValueInput[firstValueEnd] === ')') {
    // No more fields.
    return firstValueEnd;
  }

  // Parse the rest of the object properties.
  return firstValueEnd + parseURIChargeElements(to, firstValueInput.slice(firstValueEnd));
}

function parseURIChargeElements(
  to: URIChargeTarget$Array,
  input: string /* never empty */,
): number {
  const { consumer } = to;
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      // Suffix treated as trailing object element with suffix.
      // Thus, `(value)suffix` is the same as `(value)(suffix())`.
      const suffixConsumer = consumer.startObject();

      suffixConsumer.addSuffix(decodeURIComponent(input));
      suffixConsumer.endObject();

      return offset + input.length;
    }

    if (keyEnd) {
      // New key specified explicitly.
      // Add trailing object element and pass the rest of the input there.
      // Thus, `(value1)key(value2)` is the same as `(value1)(key(value2))`.
      const key = decodeURIComponent(input.slice(0, keyEnd));
      const firstValueOffset = keyEnd + 1;
      const objectConsumer = consumer.startObject();
      const objectEnd =
        offset
        + firstValueOffset
        + parseURIChargeObject({ key, consumer: objectConsumer }, input.slice(firstValueOffset));

      objectConsumer.endObject();

      return objectEnd;
    }

    if (input[keyEnd] === ')') {
      return offset + keyEnd;
    }

    input = input.slice(keyEnd + 1);
    offset += keyEnd + 1;

    const nextKeyStart = parseURIChargeValue(to, input) + 1;

    if (nextKeyStart >= input.length) {
      return offset + input.length;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}

function parseURIChargeValue(to: URIChargeTarget, input: string): number {
  const valueEnd = input.search(PARENT_PATTERN);

  if (valueEnd < 0) {
    // Up to the end of input.
    decodeURIChargeValue(to, input);

    return input.length;
  }
  if (input[valueEnd] === ')') {
    // Up to closing parent.
    decodeURIChargeValue(to, input.slice(0, valueEnd));

    return valueEnd;
  }

  // Opening parent.
  const { key, consumer } = to;

  if (valueEnd) {
    // Start nested object and parse first property.
    const firstKey = decodeURIComponent(input.slice(0, valueEnd));
    const firstValueOffset = valueEnd + 1;
    const objectConsumer = key != null ? consumer.startObject(key) : consumer.startObject();
    const objectEnd =
      firstValueOffset
      + parseURIChargeObject(
        {
          key: firstKey,
          consumer: objectConsumer,
        },
        input.slice(firstValueOffset),
      );

    objectConsumer.endObject();

    return objectEnd;
  }

  // Empty key. Start nested array and parse first element.

  const arrayConsumer = key != null ? consumer.startArray(key) : consumer.startArray();
  const arrayEnd =
    parseURIChargeArray(
      {
        consumer: arrayConsumer,
      },
      input.slice(1),
    ) + 1;

  arrayConsumer.endArray();

  return arrayEnd;
}

function decodeURIChargeValue(to: URIChargeTarget, input: string): void {
  if (!input) {
    // Empty corresponds to `true`.
    addBooleanURICharge(to, true);
  } else {
    const decoder = URI_CHARGE_DECODERS[input[0]];

    if (decoder) {
      decoder(to, input);
    } else {
      decodeStringURICharge(to, input);
    }
  }
}

const URI_CHARGE_DECODERS: {
  [firstChar: string]: (to: URIChargeTarget, input: string) => void;
} = {
  '!': decodeExclamationPrefixedURICharge,
  '-': decodeMinusSignedURICharge,
  0: decodeUnsignedURICharge,
  1: decodeNumberURICharge,
  2: decodeNumberURICharge,
  3: decodeNumberURICharge,
  4: decodeNumberURICharge,
  5: decodeNumberURICharge,
  6: decodeNumberURICharge,
  7: decodeNumberURICharge,
  8: decodeNumberURICharge,
  9: decodeNumberURICharge,
  "'": decodeQuotedURICharge,
};

function decodeExclamationPrefixedURICharge(to: URIChargeTarget, input: string): void {
  if (input.length === 1) {
    addBooleanURICharge(to, true);
  } else {
    decodeStringURICharge(to, input);
  }
}

function decodeMinusSignedURICharge(to: URIChargeTarget, input: string): void {
  if (input.length === 1) {
    addBooleanURICharge(to, false);
  } else {
    const secondChar = input[1];

    if (secondChar >= '0' && secondChar <= '9') {
      decodeNumericURICharge(to, input, 1, negate);
    } else {
      decodeStringURICharge(to, input);
    }
  }
}

function decodeNumberURICharge({ key, consumer }: URIChargeTarget, input: string): void {
  const value = Number(input);

  if (key != null) {
    consumer.addNumber(key, value);
  } else {
    consumer.addNumber(value);
  }
}

function decodeQuotedURICharge({ key, consumer }: URIChargeTarget, input: string): void {
  const value = decodeURIComponent(input.slice(1));

  if (key != null) {
    consumer.addString(key, value);
  } else {
    consumer.addString(value);
  }
}

function decodeStringURICharge({ key, consumer }: URIChargeTarget, input: string): void {
  const value = decodeURIComponent(input);

  if (key != null) {
    consumer.addString(key, value);
  } else {
    consumer.addString(value);
  }
}

function addBooleanURICharge({ key, consumer }: URIChargeTarget, value: boolean): void {
  if (key != null) {
    consumer.addBoolean(key, value);
  } else {
    consumer.addBoolean(value);
  }
}

function decodeUnsignedURICharge(to: URIChargeTarget, input: string): void {
  decodeNumericURICharge(to, input, 0, asis);
}

function negate<T extends number | bigint>(value: T): T {
  return -value as T;
}

function decodeNumericURICharge(
  { key, consumer }: URIChargeTarget,
  input: string,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): void {
  if (input[offset + 1] === 'n') {
    const value = sign(input.length < offset + 3 ? 0n : BigInt(input.slice(offset + 2)));

    if (key != null) {
      consumer.addBigInt(key, value);
    } else {
      consumer.addBigInt(value);
    }
  } else {
    const value = sign(input.length < offset + 3 ? 0 : Number(input.slice(offset)));

    if (key != null) {
      consumer.addNumber(key, value);
    } else {
      consumer.addNumber(value);
    }
  }
}

type URIChargeTarget = URIChargeTarget$Property | URIChargeTarget$Array;

interface URIChargeTarget$Property {
  readonly key: string;
  readonly consumer: ChURIObjectConsumer;
}

interface URIChargeTarget$Array {
  readonly key?: undefined;
  readonly consumer: ChURIArrayConsumer;
}
