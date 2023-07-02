import { esEscapeString, esQuoteKey } from 'esgen';
import { UcErrorInfo } from '../schema/uc-error.js';
import { printUcTokens } from '../syntax/print-uc-token.js';
import { UcToken } from '../syntax/uc-token.js';
import { Ucrx } from './ucrx.js';

/**
 * Charge rejection reason.
 *
 * Contains rejection {@link UcErrorInfo error info} except its {@link UcErrorInfo#path path}. The latter added
 * automatically.
 */
export type UcrxRejection = Omit<UcErrorInfo, 'path'>;

/**
 * Signature of function to call when received value rejected.
 *
 * Passed to {@link Ucrx charge receiver} for the latter to report rejections.
 *
 * @param rejection - Rejection reason.
 *
 * @returns Always `0` to be able to return it from receiver's method.
 */
export type UcrxReject = (this: void, rejection: UcrxRejection) => 0;

export function ucrxRejectType(type: string, rx: Ucrx, expectedTypes = rx.types): UcrxRejection {
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

export function ucrxRejectSyntax(type: string, cause: unknown): UcrxRejection {
  if (typeof cause === 'string') {
    return {
      code: 'invalidSyntax',
      details: { type },
      message: cause,
    };
  }

  return {
    code: 'invalidSyntax',
    details: { type },
    message: (cause as Error).message,
    cause,
  };
}

export function ucrxRejectNull(rx: Ucrx): UcrxRejection {
  return ucrxRejectType(
    'null',
    rx,
    rx.types.filter(type => type !== 'null'),
  );
}

export function ucrxRejectMissingEntries(
  assigned: { readonly [key: string]: 1 | undefined },
  entries: { readonly [key: string]: { use: 1 | 0 } },
): UcrxRejection {
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
    message: `Map entries missing: ${keys.map(key => '"' + esEscapeString(key) + '"').join(', ')}`,
  };
}

export function ucrxRejectSingleItem(rx: Ucrx): UcrxRejection {
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

export function ucrxRejectEntry(key: string): UcrxRejection {
  return {
    code: 'unexpectedEntry',
    details: {
      key,
    },
    message: `Unexpected entry: ${esQuoteKey(key, '"')}`,
  };
}

export function ucrxRejectEntity(entity: string): UcrxRejection {
  return {
    code: 'unrecognizedEntity',
    details: {
      entity,
    },
    message: `Unrecognized entity: !${entity}`,
  };
}

export function ucrxRejectFormat(format: string, data: readonly UcToken[]): UcrxRejection {
  return {
    code: 'unrecognizedFormat',
    details: {
      format,
      data,
    },
    message: `Unrecognized data format: !${format}'${printUcTokens(data)}`,
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
