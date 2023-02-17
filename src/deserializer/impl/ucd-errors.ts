import { quotePropertyKey } from '../../impl/quote-property-key.js';
import { UcErrorInfo } from '../../schema/uc-error.js';
import { UcdRx, UcdValueRx } from '../ucd-rx.js';

export function ucdUnexpectedError(type: string, rx: UcdRx): UcErrorInfo {
  const expectedTypes = ucdExpectedTypes(rx);

  return {
    code: 'unexpected',
    details: {
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

export function ucdUnexpectedEntryError(key: string): UcErrorInfo {
  return {
    code: 'unexpectedEntry',
    details: {
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
