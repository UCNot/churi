import { escapeJsString, quotePropertyKey } from '../impl/quote-property-key.js';
import { UcErrorInfo } from '../schema/uc-error.js';
import { printUcTokens } from '../syntax/print-uc-token.js';
import { UcToken } from '../syntax/uc-token.js';
import { Ucrx } from './ucrx.js';

export function ucrxUnexpectedTypeError(type: string, rx: Ucrx): UcErrorInfo {
  const expectedTypes = ucrxExpectedTypes(rx);

  return {
    code: 'unexpectedType',
    details: {
      type,
      expected: {
        types: expectedTypes,
      },
    },
    message: `Unexpected ${type}, while ${ucrxTypeNames(expectedTypes)} expected`,
  };
}

export function ucrxMissingEntriesError(
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

export function ucrxUnexpectedSingleItem(rx: Ucrx): UcErrorInfo {
  const types = ucrxExpectedTypes(rx);

  return {
    code: 'unexpectedType',
    details: {
      types,
      expected: {
        types: ['list'],
      },
    },
    message: `Unexpected single ${ucrxTypeNames(types)}, while list expected`,
  };
}

export function ucrxUnexpectedEntryError(key: string): UcErrorInfo {
  return {
    code: 'unexpectedEntry',
    details: {
      key,
    },
    message: `Unexpected entry: ${quotePropertyKey(key, '"')}`,
  };
}

export function ucrxUnrecognizedEntityError(entity: readonly UcToken[]): UcErrorInfo {
  return {
    code: 'unrecognizedEntity',
    details: {
      entity,
    },
    message: `Unrecognized entity: ${printUcTokens(entity)}`,
  };
}

export function ucrxExpectedTypes(rx: Ucrx): readonly string[] {
  const types = Object.entries(rx)
    .map(([key, value]) => (value ? UCRX_TYPE_NAMES[key] ?? key : 0))
    .filter((name): name is string => !!name);

  return types.length ? types : ['none'];
}

export function ucrxTypeNames(types: readonly string[]): string {
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

const UCRX_TYPE_NAMES: { [key: PropertyKey]: string | 0 | undefined } = {
  bol: 'boolean',
  big: 'bigint',
  nls: 'nested list',
  num: 'number',
  str: 'string',
  for: 0,
  em: 0,
  ls: 0,
  nul: 'null',
} satisfies { [key in keyof Ucrx]: string | 0 };
