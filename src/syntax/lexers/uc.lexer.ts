import { UcInputLexer } from '../uc-input-lexer.js';
import {
  UC_TOKEN_AMPERSAND,
  UC_TOKEN_APOSTROPHE,
  UC_TOKEN_ASTERISK,
  UC_TOKEN_AT_SIGN,
  UC_TOKEN_CLOSING_BRACKET,
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_COLON,
  UC_TOKEN_COMMA,
  UC_TOKEN_CR,
  UC_TOKEN_CRLF,
  UC_TOKEN_DOLLAR_SIGN,
  UC_TOKEN_EQUALS_SIGN,
  UC_TOKEN_EXCLAMATION_MARK,
  UC_TOKEN_HASH,
  UC_TOKEN_LF,
  UC_TOKEN_OPENING_BRACKET,
  UC_TOKEN_OPENING_PARENTHESIS,
  UC_TOKEN_PLUS_SIGN,
  UC_TOKEN_QUESTION_MARK,
  UC_TOKEN_SEMICOLON,
  UC_TOKEN_SLASH,
  UcToken,
} from '../uc-token.js';

/**
 * URI charge lexer that splits input string(s) onto tokens.
 *
 * The input chunks {@link UcLexer#scan scanned} by lexer one at a time. Each token found is emitted by calling
 * the given emitter function. On completion, the input has to by {@link UcLexer#flush flushed} in order to process
 * the remaining input.
 */
export class UcLexer implements UcInputLexer {

  /**
   * Scans the `input` string for URI charge {@link UcToken tokens}.
   *
   * @param input - String to scan.
   *
   * @returns Array of tokens.
   */
  static scan(input: string): UcToken[] {
    const tokens: UcToken[] = [];
    const tokenizer = new UcLexer(token => tokens.push(token));

    tokenizer.scan(input);
    tokenizer.flush();

    return tokens;
  }

  static readonly #tokens: { [token: string]: (tokenizer: UcLexer) => void } = {
    '\r': tokenizer => tokenizer.#addCR(),
    '\n': tokenizer => tokenizer.#emitLF(),
    '(': tokenizer => tokenizer.#emitReserved(UC_TOKEN_OPENING_PARENTHESIS),
    ')': tokenizer => tokenizer.#emitReserved(UC_TOKEN_CLOSING_PARENTHESIS),
    ',': tokenizer => tokenizer.#emitReserved(UC_TOKEN_COMMA),
    '!': tokenizer => tokenizer.#emitReserved(UC_TOKEN_EXCLAMATION_MARK),
    '#': tokenizer => tokenizer.#emitReserved(UC_TOKEN_HASH),
    $: tokenizer => tokenizer.#emitReserved(UC_TOKEN_DOLLAR_SIGN),
    '&': tokenizer => tokenizer.#emitReserved(UC_TOKEN_AMPERSAND),
    "'": tokenizer => tokenizer.#emitReserved(UC_TOKEN_APOSTROPHE),
    '*': tokenizer => tokenizer.#emitReserved(UC_TOKEN_ASTERISK),
    '+': tokenizer => tokenizer.#emitReserved(UC_TOKEN_PLUS_SIGN),
    '/': tokenizer => tokenizer.#emitReserved(UC_TOKEN_SLASH),
    ':': tokenizer => tokenizer.#emitReserved(UC_TOKEN_COLON),
    ';': tokenizer => tokenizer.#emitReserved(UC_TOKEN_SEMICOLON),
    '=': tokenizer => tokenizer.#emitReserved(UC_TOKEN_EQUALS_SIGN),
    '?': tokenizer => tokenizer.#emitReserved(UC_TOKEN_QUESTION_MARK),
    '@': tokenizer => tokenizer.#emitReserved(UC_TOKEN_AT_SIGN),
    '[': tokenizer => tokenizer.#emitReserved(UC_TOKEN_OPENING_BRACKET),
    ']': tokenizer => tokenizer.#emitReserved(UC_TOKEN_CLOSING_BRACKET),
  };

  readonly #emit: (token: UcToken) => void;
  #prev: string | typeof UC_TOKEN_CR | 0 = 0;

  /**
   * Constructs URI charge tokenizer.
   *
   * @param emit - Emitter function called each time a token is found.
   */
  constructor(emit: (token: UcToken) => void) {
    this.#emit = emit;
  }

  scan(chunk: string): void {
    for (const token of chunk.split(UC_TOKEN_PATTERN)) {
      this.#add(token);
    }
  }

  #add(token: string): void {
    if (token.length === 1) {
      const emitter = UcLexer.#tokens[token];

      if (emitter) {
        return emitter(this);
      }
    }

    this.#addString(token);
  }

  #emitPrev(): void {
    const prev = this.#prev;

    if (!prev) {
      return;
    }
    this.#prev = 0;

    if (typeof prev === 'number') {
      this.#emit(prev);

      return;
    }

    const padStart = prev.search(UC_TRAILING_PADS_PATTERN);

    if (padStart < 0) {
      return this.#emit(decodeURIComponent(prev));
    }

    if (padStart) {
      // Emit non-empty token only.
      this.#emit(decodeURIComponent(prev.slice(0, padStart)));
    }

    this.#emitPads(prev, padStart, prev.length);
  }

  #emitLF(): void {
    if (this.#prev === UC_TOKEN_CR) {
      this.#emit(UC_TOKEN_CRLF);
      this.#prev = 0;
    } else {
      this.#emitPrev();
      this.#emit(UC_TOKEN_LF);
    }
  }

  #addCR(): void {
    this.#emitPrev();
    this.#prev = UC_TOKEN_CR;
  }

  #emitReserved(token: number): void {
    this.#emitPrev();
    this.#emit(token);
  }

  #addString(token: string): void {
    if (!token) {
      return;
    }

    const prev = this.#prev;

    if (prev && typeof prev === 'number') {
      this.#emit(prev);
    }

    if (typeof prev === 'string') {
      this.#prev += token;
    } else {
      const padEnd = token.search(UC_FIRST_NON_PAD_PATTERN);

      if (padEnd < 0) {
        // Only pads found.
        this.#emitPads(token, 0, token.length);

        return;
      }

      if (padEnd) {
        this.#emitPads(token, 0, padEnd);
        this.#prev = token.slice(padEnd);
      } else {
        this.#prev = token;
      }
    }
  }

  #emitPads(token: string, padStart: number, padEnd: number): void {
    let pad = token.charCodeAt(padStart);
    let count = 0; // One less than actual padding length.

    for (let i = padStart + 1; i < padEnd; ++i) {
      const char = token.charCodeAt(i);

      if (char === pad && count < 255 /* prevent padding longer than 256 chars */) {
        // Same padding.
        ++count;
      } else {
        // Different padding char or too long padding.
        // Emit current padding and start new one.
        this.#emit(pad | (count << 8));
        pad = char;
        count = 0;
      }
    }

    this.#emit(pad | (count << 8));
  }

  flush(): void {
    this.#emitPrev();
  }

}

const UC_TOKEN_PATTERN = /([\r\n!#$&'()*+,/:;=?@[\]])/;
const UC_FIRST_NON_PAD_PATTERN = /[^ \t]/;
const UC_TRAILING_PADS_PATTERN = /[ \t]+$/;
