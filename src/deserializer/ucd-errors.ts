import { escapeJsString, quotePropertyKey } from '../impl/quote-property-key.js';
import { UcErrorInfo } from '../schema/uc-error.js';
import { printUcTokens } from '../syntax/print-uc-token.js';
import { UcToken } from '../syntax/uc-token.js';
import { UcdItemRx, UcdRx } from './ucd-rx.js';

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
  assigned: { readonly [key: string]: 1 | undefined },
  entries: { readonly [key: string]: { use: 1 | 0 } },
): UcErrorInfo {
  const requiredKeys = new Set(
    Object.entries(entries)
      .filter(([, { use }]) => use)
      .map(([key]) => key),
  );

  for (const assignedKey of Object.keys(assigned)) {
    requiredKeys.delete(assignedKey);
  }

  const keys = [...requiredKeys];

  return {
    code: 'missingEntries',
    details: {
      keys,
    },
    message: `Map entries missing: ${keys.map(key => '"' + escapeJsString(key) + '"').join(', ')}`,
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
  const types = Object.keys(rx._)
    .map(key => UCD_TYPE_NAMES[key] ?? key)
    .filter((name): name is string => !!name);

  return types.length ? types : ['none'];
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

const UCD_TYPE_NAMES: { [key: PropertyKey]: string | 0 | undefined } = {
  bol: 'boolean',
  big: 'bigint',
  nls: 'nested list',
  nul: 'null',
  num: 'number',
  str: 'string',
  for: 0,
} satisfies { [key in keyof UcdItemRx]: string | 0 };
