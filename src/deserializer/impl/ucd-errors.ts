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
      `Unexpected ${type}. Expected `
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

function ucdExpectedTypes(rx: UcdRx): readonly string[] {
  const keys = Object.keys(rx._).map(key => UCD_TYPE_NAMES[key] ?? key);

  return keys.length ? keys : ['none'];
}

const UCD_TYPE_NAMES: { [key: PropertyKey]: string | undefined } = {
  bol: 'boolean',
  big: 'bigint',
  nul: 'null',
  num: 'number',
  str: 'string',
} satisfies { [key in keyof UcdValueRx]: string };
