import { UcInputLexer } from './uc-input-lexer.js';
import { UcToken } from './uc-token.js';

/**
 * Plain text lexer.
 *
 * The input chunks converted to string tokens directly, without any change.
 */
export class UcPlainTextLexer implements UcInputLexer {

  readonly #emit: (token: UcToken) => void;

  constructor(emit: (token: UcToken) => void) {
    this.#emit = emit;
  }

  scan(chunk: string): void {
    this.#emit(chunk);
  }

  flush(): void {}

}
