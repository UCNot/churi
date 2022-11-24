import { asis } from '@proc7ts/primitives';
import { URIChargeConsumer } from './uri-charge-consumer.js';
import { URIChargeValue } from './uri-charge-value.js';
import { DefaultURIChargeVisitor, URIChargeVisitor } from './uri-charge-visitor.js';

export function parseURICharge<T>(
  input: string,
  parser: URIChargeVisitor<T>,
): URIChargeParseResult<T>;

export function parseURICharge(input: string): URIChargeParseResult;

export function parseURICharge<T>(
  input: string,
  parser: URIChargeVisitor<T> = new DefaultURIChargeVisitor() as URIChargeVisitor<unknown> as URIChargeVisitor<T>,
): URIChargeParseResult<T> {
  const keyEnd = input.search(PARENT_PATTERN);

  if (keyEnd < 0) {
    return {
      charge: parser.visitString(decodeURIComponent(input)),
      end: input.length,
    };
  }

  const key = decodeURIComponent(input.slice(0, keyEnd));

  if (input[keyEnd] === ')') {
    return {
      charge: parser.visitString(key),
      end: keyEnd,
    };
  }

  const firstValueOffset = keyEnd + 1;
  const [consumer, endCharge] = parser.visitObject();
  const end = firstValueOffset + parseURIChargeObject(key, input.slice(firstValueOffset), consumer);

  return {
    end,
    charge: endCharge(),
  };
}

export interface URIChargeParseResult<T = string | URIChargeValue.Object> {
  readonly charge: T;
  readonly end: number;
}

const PARENT_PATTERN = /[()]/;

function parseURIChargeObject(
  key: string,
  firstValueInput: string,
  consumer: URIChargeConsumer,
): number {
  // Opening parent.
  // Start nested object and parse first property.
  const firstValueEnd = parseURIChargeValue(key, firstValueInput, consumer) + 1; // After closing parent.

  if (firstValueEnd >= firstValueInput.length) {
    // End of input.
    consumer.endObject();

    return firstValueInput.length;
  }
  if (firstValueInput[firstValueEnd] === ')') {
    // No more fields.
    consumer.endObject();

    return firstValueEnd;
  }

  // Parse the rest of the object properties.
  return (
    firstValueEnd + parseURIChargeProperties(key, firstValueInput.slice(firstValueEnd), consumer)
  );
}

function parseURIChargeValue(key: string, input: string, consumer: URIChargeConsumer): number {
  const valueEnd = input.search(PARENT_PATTERN);

  if (valueEnd < 0) {
    // Up to the end of input.
    decodeURIChargeValue(key, input, consumer);

    return input.length;
  }
  if (input[valueEnd] === ')') {
    // Up to closing parent.
    decodeURIChargeValue(key, input.slice(0, valueEnd), consumer);

    return valueEnd;
  }

  // Opening parent.
  // Start nested object and parse first property.
  const firstKey = decodeURIComponent(input.slice(0, valueEnd));
  const firstValueOffset = valueEnd + 1;

  return (
    firstValueOffset
    + parseURIChargeObject(firstKey, input.slice(firstValueOffset), consumer.startObject(key))
  );
}

function parseURIChargeProperties(
  key: string,
  input: string /* never empty */,
  consumer: URIChargeConsumer,
): number {
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      consumer.addSuffix(decodeURIComponent(input));
      consumer.endObject();

      return offset + input.length;
    }

    if (keyEnd) {
      // New key specified explicitly.
      // Otherwise, the previous one reused. Thus, `key(value1)(value2)` is the same as `key(value1)key(value2)`.
      key = decodeURIComponent(input.slice(0, keyEnd));
    }

    if (input[keyEnd] === ')') {
      if (keyEnd) {
        consumer.addSuffix(key);
      }
      consumer.endObject();

      return offset + keyEnd;
    }

    input = input.slice(keyEnd + 1);
    offset += keyEnd + 1;

    const nextKeyStart = parseURIChargeValue(key, input, consumer) + 1;

    if (nextKeyStart >= input.length) {
      consumer.endObject();

      return offset + input.length;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}

function decodeURIChargeValue(key: string, input: string, consumer: URIChargeConsumer): void {
  if (!input) {
    // Empty corresponds to `true`.
    consumer.addBoolean(key, true);

    return;
  }

  const decoder = URI_CHARGE_DECODERS[input[0]];

  if (decoder) {
    decoder(key, input, consumer);
  } else {
    consumer.addString(key, decodeURIComponent(input));
  }
}

const URI_CHARGE_DECODERS: {
  [firstChar: string]: (key: string, input: string, consumer: URIChargeConsumer) => void;
} = {
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

function decodeMinusSignedURICharge(key: string, input: string, consumer: URIChargeConsumer): void {
  decodeSignedURICharge(key, input, consumer, false, negate);
}

function decodeNumberURICharge(key: string, input: string, consumer: URIChargeConsumer): void {
  return consumer.addNumber(key, Number(input));
}

function decodeQuotedURICharge(key: string, input: string, consumer: URIChargeConsumer): void {
  return consumer.addString(key, decodeURIComponent(input.slice(1)));
}

function decodeUnsignedURICharge(key: string, input: string, consumer: URIChargeConsumer): void {
  decodeNumericURICharge(key, input, consumer, 0, asis);
}

function negate<T extends number | bigint>(value: T): T {
  return -value as T;
}

function decodeSignedURICharge(
  key: string,
  input: string,
  consumer: URIChargeConsumer,
  flag: boolean,
  sign: <T extends number | bigint>(value: T) => T,
): void {
  if (input.length === 1) {
    consumer.addBoolean(key, flag);
  } else {
    const secondChar = input[1];

    if (secondChar >= '0' && secondChar <= '9') {
      decodeNumericURICharge(key, input, consumer, 1, sign);
    } else {
      consumer.addString(key, decodeURIComponent(input));
    }
  }
}

function decodeNumericURICharge(
  key: string,
  input: string,
  consumer: URIChargeConsumer,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): void {
  const secondChar = input[offset + 1];

  switch (secondChar) {
    case 'n':
      consumer.addBigInt(
        key,
        sign(input.length < offset + 3 ? 0n : BigInt(input.slice(offset + 2))),
      );

      return;
    default:
      consumer.addNumber(key, sign(input.length < offset + 3 ? 0 : Number(input.slice(offset))));

      return;
  }
}
