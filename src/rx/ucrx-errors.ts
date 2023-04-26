import { escapeJsString, quoteJsKey } from 'httongue';
import { UcErrorInfo } from '../schema/uc-error.js';
import { printUcTokens } from '../syntax/print-uc-token.js';
import { UcToken } from '../syntax/uc-token.js';
import { Ucrx } from './ucrx.js';

export function ucrxUnexpectedTypeError(
  type: string,
  rx: Ucrx,
  expectedTypes = rx.types,
): UcErrorInfo {
  return {
    code: 'unexpectedType',
    details: {
      type,
      expected: {
        types: expectedTypes,
      },
    },
    message: `Unexpected ${type} instead of ${ucrxTypeNames(expectedTypes)}`,
  };
}

export function ucrxUnexpectedNullError(rx: Ucrx): UcErrorInfo {
  return ucrxUnexpectedTypeError(
    'null',
    rx,
    rx.types.filter(type => type !== 'null'),
  );
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

export function ucrxUnexpectedSingleItemError(rx: Ucrx): UcErrorInfo {
  const { types } = rx;

  return {
    code: 'unexpectedType',
    details: {
      types,
      expected: {
        types: ['list'],
      },
    },
    message: `Unexpected single ${ucrxTypeNames(types)} instead of list`,
  };
}

export function ucrxUnexpectedEntryError(key: string): UcErrorInfo {
  return {
    code: 'unexpectedEntry',
    details: {
      key,
    },
    message: `Unexpected entry: ${quoteJsKey(key, '"')}`,
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
