import { asis } from '@proc7ts/primitives';
import { URIChargeParser$Default } from './uri-charge-parser.impl.js';
import { URIChargeParser } from './uri-charge-parser.js';

export function parseURICharge<T>(
  input: string,
  parser: URIChargeParser<T>,
): URIChargeParser.Result<T>;

export function parseURICharge(input: string): URIChargeParser.Result;

export function parseURICharge<T>(
  input: string,
  parser: URIChargeParser<T> = new URIChargeParser$Default() as URIChargeParser<unknown> as URIChargeParser<T>,
): URIChargeParser.Result<T> {
  const keyEnd = input.search(PARENT_PATTERN);

  if (keyEnd < 0) {
    return {
      charge: parser.parseString(input),
      end: input.length,
    };
  }

  const encodedKey = input.slice(0, keyEnd);

  if (input[keyEnd] === ')') {
    return {
      charge: parser.parseString(encodedKey),
      end: keyEnd,
    };
  }

  const firstValueOffset = keyEnd + 1;
  const [consumer, endCharge] = parser.parseObject();
  const end =
    firstValueOffset
    + parseURIChargeObject(decodeURIComponent(encodedKey), input.slice(firstValueOffset), consumer);

  return {
    end,
    charge: endCharge(),
  };
}

const PARENT_PATTERN = /[()]/;

function parseURIChargeObject(
  key: string,
  firstValueInput: string,
  consumer: URIChargeParser.Consumer,
): number {
  // Opening parent.
  // Start nested object and parse first property.
  const firstValueEnd = parseURIChargeValue(key, firstValueInput, consumer) + 1; // After closing parent.

  if (firstValueEnd >= firstValueInput.length) {
    // End of input.
    consumer.endObject('');

    return firstValueInput.length;
  }
  if (firstValueInput[firstValueEnd] === ')') {
    // No more fields.
    consumer.endObject('');

    return firstValueEnd;
  }

  // Parse the rest of the object properties.
  return firstValueEnd + parseURIChargeProperties(firstValueInput.slice(firstValueEnd), consumer);
}

function parseURIChargeValue(
  key: string,
  input: string,
  consumer: URIChargeParser.Consumer,
): number {
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

function parseURIChargeProperties(input: string, consumer: URIChargeParser.Consumer): number {
  let offset = 0;

  for (;;) {
    const keyEnd = input.search(PARENT_PATTERN);

    if (keyEnd < 0) {
      consumer.endObject(decodeURIComponent(input));

      return offset + input.length;
    }

    const key = keyEnd ? decodeURIComponent(input.slice(0, keyEnd)) : '';

    if (input[keyEnd] === ')') {
      consumer.endObject(key);

      return offset + keyEnd;
    }

    input = input.slice(keyEnd + 1);
    offset += keyEnd + 1;

    const nextKeyStart = parseURIChargeValue(key, input, consumer) + 1;

    if (nextKeyStart >= input.length) {
      consumer.endObject('');

      return offset + input.length;
    }

    input = input.slice(nextKeyStart);
    offset += nextKeyStart;
  }
}

function decodeURIChargeValue(
  key: string,
  input: string,
  consumer: URIChargeParser.Consumer,
): void {
  if (!input) {
    // Empty value
    consumer.addString(key, '');

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
  [firstChar: string]: (key: string, input: string, consumer: URIChargeParser.Consumer) => void;
} = {
  '-': decodeMinusSignedURICharge,
  '+': decodePlusSignedURICharge,
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

function decodeMinusSignedURICharge(
  key: string,
  input: string,
  consumer: URIChargeParser.Consumer,
): void {
  decodeSignedURICharge(key, input, consumer, false, negate);
}

function decodePlusSignedURICharge(
  key: string,
  input: string,
  consumer: URIChargeParser.Consumer,
): void {
  decodeSignedURICharge(key, input, consumer, true, asis);
}

function decodeNumberURICharge(
  key: string,
  input: string,
  consumer: URIChargeParser.Consumer,
): void {
  return consumer.addNumber(key, Number(input));
}

function decodeQuotedURICharge(
  key: string,
  input: string,
  consumer: URIChargeParser.Consumer,
): void {
  return consumer.addString(key, decodeURIComponent(input.slice(1)));
}

function decodeUnsignedURICharge(
  key: string,
  input: string,
  consumer: URIChargeParser.Consumer,
): void {
  decodeNumericURICharge(key, input, consumer, 0, asis);
}

function negate<T extends number | bigint>(value: T): T {
  return -value as T;
}

function decodeSignedURICharge(
  key: string,
  input: string,
  consumer: URIChargeParser.Consumer,
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
  consumer: URIChargeParser.Consumer,
  offset: number,
  sign: <T extends number | bigint>(value: T) => T,
): void {
  const firstChar = input[offset];

  if (firstChar === '0') {
    const secondChar = input[offset + 1];

    switch (secondChar) {
      case 'n':
        consumer.addBigInt(
          key,
          input.length < offset + 3 ? 0n : sign(BigInt(input.slice(offset + 2))),
        );

        return;
      default:
        consumer.addNumber(key, input.length < offset + 3 ? 0 : sign(Number(input.slice(offset))));
    }
  }

  return consumer.addNumber(key, input.length < offset + 3 ? 0 : sign(Number(input.slice(offset))));
}
