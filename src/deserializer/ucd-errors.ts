import { escapeJsString, quotePropertyKey } from '../impl/quote-property-key.js';
import { UcErrorInfo } from '../schema/uc-error.js';
import { printUcTokens } from '../syntax/print-uc-token.js';
import { UcToken } from '../syntax/uc-token.js';
import { UcdRx, UcdValueRx } from './ucd-rx.js';

export function ucdUnexpectedTypeError(type: string, rx: UcdRx): UcErrorInfo {
  const expectedTypes = ucdExpectedTypes(rx);

  return {
    code: 'unexpectedType',
    details: {
      type,
      expected: {
        types: expectedTypes,
      },
    },
    message: `Unexpected ${type}, while ${ucdTypeNames(expectedTypes)} expected`,
  };
}

export function ucdMissingEntriesError(
  received: { readonly [key: string]: undefined },
  required: { readonly [key: string]: 1 | undefined },
): UcErrorInfo {
  const requiredKeys = new Set(Object.keys(required));

  for (const receivedKey of Object.keys(received)) {
    requiredKeys.delete(receivedKey);
  }

  const keys = [...requiredKeys];

  return {
    code: 'missingEntries',
    details: {
      keys,
    },
    message: `Map entries missing: ${keys.map(escapeJsString).join(', ')}`,
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

export function ucdUnrecognizedEntityError(entity: readonly UcToken[]): UcErrorInfo {
  return {
    code: 'unrecognizedEntity',
    details: {
      entity,
    },
    message: `Unrecognized entity: ${printUcTokens(entity)}`,
  };
}

export function ucdExpectedTypes(rx: UcdRx): readonly string[] {
  const types = Object.keys(rx._).map(key => UCD_TYPE_NAMES[key] ?? key);

  return types.length ? types : ['value'];
}

export function ucdTypeNames(types: readonly string[]): string {
  if (types.length === 1) {
    return types[0];
  }
  if (types.length === 2) {
    return `${types[0]} or ${types[1]}`;
  }

  return types.reduce((prev, type, index) => {
    if (!prev) {
      return type;
    }
    if (index + 1 === types.length) {
      return `${prev}, or ${type}`;
    }

    return `${prev}, ${type}`;
  }, '');
}

const UCD_TYPE_NAMES: { [key: PropertyKey]: string | undefined } = {
  bol: 'boolean',
  big: 'bigint',
  nls: 'nested list',
  nul: 'null',
  num: 'number',
  str: 'string',
} satisfies { [key in keyof UcdValueRx]: string };
