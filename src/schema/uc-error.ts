import type { URIChargePath } from './uri-charge/uri-charge-path.js';

/**
 * Charge error.
 *
 * Represents an {@link UcErrorInfo error info} wrapped into `Error`.
 */
export class UcError extends Error implements UcErrorInfo {

  /**
   * Creates URI charge error caused by the given `cause`.
   *
   * - If the given `cause` is {@link UcError} already, then just returns it.
   * - If the given `cause` is an {@link UcErrorInfo error info}, then wraps it into error.
   * - If the given `cause` is a string, then uses it as error {@link message}, with `error` {@link code}.
   * - If the given `cause` is an `Error`, the uses its message as error {@link message}, and `Error` instance
   *   as error {@link cause} with `error` {@link cause}.
   * - Otherwise, uses the `cause` as error {@link cause} with `error` {@link code} and default error
   *   {@link message}.
   *
   * @param cause - Cause of error.
   *
   * @returns Error instance.
   */
  static create(cause: unknown): UcError {
    if (cause instanceof UcError) {
      return cause;
    }
    if (cause instanceof Error) {
      return new UcError({ code: 'error', path: [{}], message: cause.message, cause });
    }
    if (isUcErrorInfo(cause)) {
      return new UcError(cause);
    }
    if (typeof cause === 'string') {
      return new UcError({ code: 'error', path: [{}], message: cause });
    }

    return new UcError({ code: 'error', path: [{}], cause });
  }

  readonly #code: string;
  readonly #path: URIChargePath;
  readonly #details: Exclude<UcErrorInfo['details'], undefined>;

  /**
   * Constructs error with the given `info`.
   *
   * @param info - Error info.
   */
  constructor(info: UcErrorInfo) {
    const { code, path, details = {}, message = 'Unexpected error', cause } = info;

    super(message, { cause });

    this.name = 'UcError';
    this.#code = code;
    this.#path = path;
    this.#details = details;
  }

  get code(): string {
    return this.#code;
  }

  get path(): URIChargePath {
    return this.#path;
  }

  get details(): Exclude<UcErrorInfo['details'], undefined> {
    return this.#details;
  }

  toJSON(): UcErrorInfo {
    return {
      code: this.code,
      path: this.path,
      details: this.details,
      message: this.message,
      cause: this.cause,
    };
  }

}

/**
 * Information about charge error.
 */
export interface UcErrorInfo {
  /**
   * Error code.
   */
  readonly code: string;

  /**
   * Path to the value containing the error.
   */
  readonly path: URIChargePath;

  /**
   * Error details that can be used e.g. to build localized error {@link message}.
   */
  readonly details?: Readonly<Record<string, unknown>>;

  /**
   * Default error message in English.
   *
   * @defaultValue `'Unexpected error'`
   */
  readonly message?: string | undefined;

  /**
   * Error cause. E.g. an exception thrown.
   */
  readonly cause?: unknown;
}

function isUcErrorInfo(cause: unknown): cause is UcErrorInfo {
  return (
    typeof cause === 'object'
    && !!cause
    && typeof (cause as Partial<UcErrorInfo>).code === 'string'
    && (typeof (cause as UcErrorInfo).message === 'string'
      || (cause as UcErrorInfo).message === undefined)
    && (typeof (cause as UcErrorInfo).details === 'object'
      || (cause as UcErrorInfo).details === undefined)
  );
}
