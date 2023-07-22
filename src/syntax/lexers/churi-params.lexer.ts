import { decodeURISearchPart } from 'httongue';
import { UcLexer } from '../uc-lexer.js';
import {
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_DOLLAR_SIGN,
  UC_TOKEN_INSET,
  UC_TOKEN_OPENING_PARENTHESIS,
  UcToken,
} from '../uc-token.js';

export class ChURIParamsLexer implements UcLexer {

  readonly #emit: (token: UcToken) => void;
  readonly #splitter: string;
  readonly #delimiter: RegExp;
  #emitted = false;
  #key = '';
  #value = false;

  constructor(emit: (token: UcToken) => void, splitter: '&' | ';' = '&') {
    this.#emit = token => {
      emit(token);
      this.#emitted = true;
    };
    this.#splitter = splitter;
    this.#delimiter = CHURI_DELIMITER_PATTERNS[splitter];
  }

  scan(chunk: string): void {
    while (chunk) {
      if (this.#value) {
        const valueEnd = chunk.indexOf(this.#splitter);

        if (valueEnd < 0) {
          this.#emit(chunk);

          break;
        }
        if (valueEnd) {
          this.#emit(chunk.slice(0, valueEnd));
        }
        this.#emit(UC_TOKEN_INSET); // End of value.
        this.#emit(UC_TOKEN_CLOSING_PARENTHESIS);

        this.#value = false;
        chunk = chunk.slice(valueEnd + 1);
      } else {
        const match = this.#delimiter.exec(chunk);

        if (!match) {
          this.#key += chunk;

          break;
        }

        const { index } = match;
        const [found] = match;

        if (found === '=') {
          // Value following the key.
          this.#key += chunk.slice(0, index);
          if (this.#key) {
            this.#emitKey();
          } else {
            // Empty key.
            this.#emit(UC_TOKEN_DOLLAR_SIGN);
          }

          // Start the value.
          this.#value = true;
          this.#emit(UC_TOKEN_OPENING_PARENTHESIS);
          this.#emit(UC_TOKEN_INSET);
          chunk = chunk.slice(index + 1);
        } else {
          // Entry without value.
          if (index) {
            this.#key += chunk.slice(0, index);
          }
          if (this.#key) {
            this.#emitEmptyEntry();
          }

          chunk = chunk.slice(index + found.length);
        }
      }
    }
  }

  flush(): void {
    if (this.#value) {
      this.#value = false;
      this.#emit(UC_TOKEN_INSET);
      this.#emit(UC_TOKEN_CLOSING_PARENTHESIS);
    } else if (this.#key) {
      this.#emitEmptyEntry();
    } else if (!this.#emitted) {
      // Emit empty map.
      this.#emit(UC_TOKEN_DOLLAR_SIGN);
    }
  }

  #emitKey(): void {
    const key = this.#key;

    this.#key = '';

    this.#emit(decodeURISearchPart(key));
  }

  #emitEmptyEntry(): void {
    this.#emitKey();
    this.#emit(UC_TOKEN_OPENING_PARENTHESIS);
    this.#emit(UC_TOKEN_CLOSING_PARENTHESIS);
  }

}

const CHURI_DELIMITER_PATTERNS = {
  '&': /=|&+/,
  ';': /=|;+/,
};
