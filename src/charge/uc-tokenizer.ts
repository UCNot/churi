import {
  UcToken,
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
} from './uc-token.js';

/**
 * URI charge tokenizer that splits input string(s) onto tokens.
 *
 * The input strings {@link UcTokenizer#split splat} by tokenizer one at a time. Each token found is emitted by calling
 * the given emitter function. On completion, the input has to by {@link UcTokenizer#flush flushed} in order to process
 * partial input.
 */
export class UcTokenizer {

  static readonly #tokens: { [token: string]: (tokenizer: UcTokenizer) => void } = {
    '\r': tokenizer => tokenizer.#addCR(),
    '\n': tokenizer => tokenizer.#emitLF(),
    '(': tokenizer => tokenizer.#emitSpecial(UC_TOKEN_OPENING_PARENTHESIS),
    ')': tokenizer => tokenizer.#emitSpecial(UC_TOKEN_CLOSING_PARENTHESIS),
    ',': tokenizer => tokenizer.#emitSpecial(UC_TOKEN_COMMA),
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
  #leadingPads = false;

  /**
   * Constructs URI charge tokenizer.
   *
   * @param emit - Emitter function called each time a token is found.
   */
  constructor(emit: (token: UcToken) => void) {
    this.#emit = emit;
  }

  /**
   * Splits the `input` string onto tokens.
   *
   * @param input - Input string to tokenize.
   */
  split(input: string): void {
    for (const token of input.split(UC_TOKEN_PATTERN)) {
      this.#add(token);
    }
  }

  #add(token: string): void {
    if (token.length === 1) {
      const emitter = UcTokenizer.#tokens[token];

      if (emitter) {
        return emitter(this);
      }
    }

    this.#addString(token);
  }

  #emitPrev(withTrailingPads: boolean): void {
    const prev = this.#prev;

    if (!prev) {
      return;
    }
    this.#prev = 0;

    if (typeof prev === 'number') {
      this.#emit(prev);

      return;
    }

    if (!withTrailingPads) {
      this.#emit(decodeURIComponent(prev));

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
      this.#emitPrev(true);
      this.#emit(UC_TOKEN_LF);
    }

    this.#leadingPads = true;
  }

  #addCR(): void {
    this.#emitPrev(true);
    this.#prev = UC_TOKEN_CR;
    this.#leadingPads = true;
  }

  #emitSpecial(token: number): void {
    this.#emitPrev(true);
    this.#emit(token);
    this.#leadingPads = true;
  }

  #emitReserved(token: number): void {
    this.#emitPrev(false);
    this.#emit(token);
    this.#leadingPads = false;
  }

  #addString(token: string): void {
    if (!token) {
      return;
    }

    const prev = this.#prev;

    if (prev && typeof prev === 'number') {
      this.#emit(prev);
    }

    if (this.#leadingPads) {
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

      this.#leadingPads = false;
    } else if (typeof prev === 'string') {
      this.#prev += token;
    } else {
      this.#prev = token;
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

  /**
   * Flushes the input emitting all pending tokens.
   */
  flush(): void {
    this.#emitPrev(true);
  }

}

const UC_TOKEN_PATTERN = /([\r\n!#$&'()*+,/:;=?@[\]])/;
const UC_FIRST_NON_PAD_PATTERN = /[^ \t]/;
const UC_TRAILING_PADS_PATTERN = /[ \t]+$/;
