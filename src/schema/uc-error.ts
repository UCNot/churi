export class UcError extends Error implements UcErrorInfo {

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

export interface UcErrorInfo {
  readonly code: string;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly message?: string | undefined;
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
