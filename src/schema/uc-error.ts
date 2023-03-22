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
      return new UcError({ code: 'error', message: cause.message, cause });
    }
    if (isUcErrorInfo(cause)) {
      return new UcError(cause);
    }
    if (typeof cause === 'string') {
      return new UcError({ code: 'error', message: cause });
    }

    return new UcError({ code: 'error', cause });
  }

  readonly #code: string;
  readonly #details: Exclude<UcErrorInfo['details'], undefined>;

  /**
   * Constructs error with the given `info`.
   *
   * @param info - Error info.
   */
  constructor(info: UcErrorInfo) {
    const { code, details = {}, message = 'Unexpected error', cause } = info;

    super(message, { cause });

    this.name = 'UcError';
    this.#code = code;
    this.#details = details;
  }

  get code(): string {
    return this.#code;
  }

  get details(): Exclude<UcErrorInfo['details'], undefined> {
    return this.#details;
  }

  toJSON(): UcErrorInfo {
    return {
      code: this.code,
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
