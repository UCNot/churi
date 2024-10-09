import { UcLexer } from '../../uc-lexer.js';
import { UC_TOKEN_APOSTROPHE, UcToken } from '../../uc-token.js';

/**
 * Plain text lexer.
 *
 * The input chunks converted to string tokens directly, without any change.
 */
export class UcPlainTextLexer implements UcLexer {
  readonly #emit: (token: UcToken) => void;
  #prefix: boolean;

  /**
   * Constructs plain text lexer.
   *
   * @param emit - Emitter function called each time a token is found.
   * @param raw - Whether to emit a raw string rather quoted string. `false` by default.
   */
  constructor(emit: (token: UcToken) => void, raw = false) {
    this.#emit = emit;
    this.#prefix = raw;
  }

  scan(chunk: string): void {
    if (!this.#prefix) {
      this.#emit(UC_TOKEN_APOSTROPHE);
      this.#prefix = true;
    }
    this.#emit(chunk);
  }

  flush(): void {}
}
