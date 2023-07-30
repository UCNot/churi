import { decodeURISearchPart } from 'httongue';
import { UcdInsetOptions } from '../../../compiler/deserialization/ucd-support-inset.js';
import { CHURI_MODULE, COMPILER_MODULE } from '../../../impl/module-names.js';
import { UcOmniConstraints } from '../../../schema/uc-constraints.js';
import { UcLexer } from '../../uc-lexer.js';
import { UC_TOKEN_APOSTROPHE, UcToken } from '../../uc-token.js';

/**
 * URI-encoded text lexer.
 *
 * Decodes URI-encoded text and emits it as string {@link UcToken tokens}.
 */
export class UcURIEncodedLexer implements UcLexer {

  /**
   * Creates URI-encoded text lexer that decodes _plus sign_ (`"+" (U+002B)`) as {@link UC_TOKEN_PREFIX_SPACE space
   * padding}.
   *
   * This is needed e.g. when tokenizing URI query parameters.
   *
   * @param emit - Emitter function called each time a token is found.
   * @param raw - Whether to emit a raw string rather quoted string. `false` by default.
   *
   * @returns New URI-encoded text lexer instance.
   */
  static plusAsSpace(emit: (token: UcToken) => void, raw?: boolean): UcURIEncodedLexer {
    const lexer = new UcURIEncodedLexer(emit, raw);

    lexer.#decode = decodeURISearchPart;

    return lexer;
  }

  readonly #emit: (token: UcToken) => void;
  #decode: (encoded: string) => string = decodeURIComponent;
  #prefix: boolean;
  #pending = '';

  /**
   * Constructs URI-encoded text lexer.
   *
   * @param emit - Emitter function called each time a token is found.
   * @param raw - Whether to emit a raw string rather quoted string. `false` by default.
   */
  constructor(emit: (token: UcToken) => void, raw = false) {
    this.#emit = emit;
    this.#prefix = raw;
  }

  scan(chunk: string): void {
    if (PERCENT_ENCODED_TAIL_PATTERN.test(chunk)) {
      this.#pending += chunk;
    } else {
      const pending = this.#pending;

      if (pending) {
        this.#pending = '';
        this.#emitNext(pending + chunk);
      } else {
        this.#emitNext(chunk);
      }
    }
  }

  flush(): void {
    const pending = this.#pending;

    if (pending) {
      this.#pending = '';
      this.#emitNext(pending);
    }
  }

  #emitNext(chunk: string): void {
    if (!this.#prefix) {
      this.#prefix = true;
      this.#emit(UC_TOKEN_APOSTROPHE);
    }
    this.#emit(this.#decode(chunk));
  }

}

const PERCENT_ENCODED_TAIL_PATTERN = /%[\da-fA-F]{0,2}$/;

/**
 * Enables inset processing as {@link UcPlainTextLexer URI-encoded text}.
 *
 * @param options - Lexer options.
 *
 * @returns Schema constraints.
 */
export function ucInsetURIEncoded(options?: {
  /**
   * Whether to decode _plus sign_ (`"+" (U+002B)`) as {@link UC_TOKEN_PREFIX_SPACE space padding}.
   *
   * @defaultValue `false`
   */
  readonly plusAsSpace?: boolean | undefined;
  /**
   * Whether to emit a raw string rather quoted string.
   *
   * @defaultValue `false`.
   */
  readonly raw?: boolean | undefined;
}): UcOmniConstraints;

export function ucInsetURIEncoded({
  plusAsSpace,
  raw,
}: {
  readonly plusAsSpace?: boolean | undefined;
  readonly raw?: boolean | undefined;
} = {}): UcOmniConstraints {
  return {
    deserializer: {
      use: 'ucdSupportInset',
      from: COMPILER_MODULE,
      with: {
        lexer: 'UcURIEncodedLexer',
        from: CHURI_MODULE,
        method: plusAsSpace ? 'plusAsSpace' : undefined,
        args: raw ? [`true`] : undefined,
      } satisfies UcdInsetOptions,
    },
  };
}
