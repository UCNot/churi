import { UcdInsetOptions } from '../../compiler/deserialization/ucd-support-inset.js';
import { CHURI_MODULE, COMPILER_MODULE } from '../../impl/module-names.js';
import { UcConstraints } from '../../schema/uc-constraints.js';
import { UcLexer } from '../uc-lexer.js';
import { UC_TOKEN_APOSTROPHE, UcToken } from '../uc-token.js';

/**
 * Plain text lexer.
 *
 * The input chunks converted to string tokens directly, without any change.
 */
export class UcPlainTextLexer implements UcLexer {

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

export function ucInsetPlainText(): UcConstraints {
  return {
    deserializer: {
      use: 'ucdSupportInset',
      from: COMPILER_MODULE,
      with: {
        lexer: 'UcPlainTextLexer',
        from: CHURI_MODULE,
      } satisfies UcdInsetOptions,
    },
  };
}
