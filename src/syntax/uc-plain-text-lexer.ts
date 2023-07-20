import { UcInputLexer } from './uc-input-lexer.js';
import { UC_TOKEN_APOSTROPHE, UcToken } from './uc-token.js';

/**
 * Plain text lexer.
 *
 * The input chunks converted to string tokens directly, without any change.
 */
export class UcPlainTextLexer implements UcInputLexer {

  readonly #emit: (token: UcToken) => void;
  #prefix = false;

  constructor(emit: (token: UcToken) => void) {
    this.#emit = emit;
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
