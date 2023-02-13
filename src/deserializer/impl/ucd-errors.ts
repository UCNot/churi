import { quotePropertyKey } from '../../impl/quote-property-key.js';
import { UcdRx, UcdValueRx } from '../ucd-rx.js';

export function ucdUnexpectedError(type: string, rx: UcdRx): unknown {
  const expectedTypes = ucdExpectedTypes(rx);

  return {
    code: 'unexpected',
    unexpected: {
      type,
      expected: {
        types: expectedTypes,
      },
    },
    message:
      `Unexpected ${type}, while expected `
      + (expectedTypes.length === 1 ? expectedTypes[0] : `one of ${expectedTypes.join(', ')}`),
  };
}

export function ucdUnexpectedEntryError(key: string, _rx: UcdRx): unknown {
  return {
    code: 'unexpectedEntry',
    unexpectedEntry: {
      key,
    },
    message: `Unexpected entry: ${quotePropertyKey(key, '"')}`,
  };
}

export function ucdExpectedTypes(rx: UcdRx): readonly string[] {
  const types = Object.keys(rx._).map(key => UCD_TYPE_NAMES[key] ?? key);

  return types.length ? types : ['value'];
}

const UCD_TYPE_NAMES: { [key: PropertyKey]: string | undefined } = {
  bol: 'boolean',
  big: 'bigint',
  nls: 'nested list',
  nul: 'null',
  num: 'number',
  str: 'string',
} satisfies { [key in keyof UcdValueRx]: string };
