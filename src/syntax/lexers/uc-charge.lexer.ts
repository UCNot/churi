import { UcdInsetOptions } from '../../compiler/deserialization/ucd-support-inset.js';
import { CHURI_MODULE, COMPILER_MODULE } from '../../impl/module-names.js';
import { UcOmniConstraints } from '../../schema/uc-constraints.js';
import { scanUcTokens } from '../scan-uc-tokens.js';
import { UcLexer } from '../uc-lexer.js';
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
 */
export class UcChargeLexer implements UcLexer {

  /**
   * Constructs URI charge lexer that decodes _plus sign_ (`"+" (U+002B)`) as {@link UC_TOKEN_PREFIX_SPACE space
   * padding}.
   *
   * This is needed e.g. when tokenizing URI query parameters.
   *
   * @param emit - Emitter function called each time a token is found.
   *
   * @returns New URI charge lexer instance.
   */
  static plusAsSpace(emit: (token: UcToken) => void): UcChargeLexer {
    const lexer = new UcChargeLexer(emit);

    lexer.#tokens = this.#paramTokens;

    return lexer;
  }

  /**
   * Scans the `input` string for URI charge {@link UcToken tokens}.
   *
   * @param input - Array of input chunks to scan.
   *
   * @returns Array of tokens.
   */
  static scan(...input: string[]): UcToken[] {
    return scanUcTokens(emit => new this(emit), ...input);
  }

  /**
   * Scans the `input` string for URI query parameter charge {@link UcToken tokens}.
   *
   * In contrast to {@link scan}, decodes _plus sign_ (`"+" (U+002B)`) as {@link UC_TOKEN_PREFIX_SPACE space padding}.
   *
   * @param input - Array of input chunks to scan.
   *
   * @returns Array of tokens.
   */
  static scanParam(...input: string[]): UcToken[] {
    return scanUcTokens(emit => this.plusAsSpace(emit), ...input);
  }

  static readonly #ucTokens: { readonly [token: string]: (lexer: UcChargeLexer) => void } = {
    '\r': lexer => lexer.#addCR(),
    '\n': lexer => lexer.#emitLF(),
    '(': lexer => lexer.#emitReserved(UC_TOKEN_OPENING_PARENTHESIS),
    ')': lexer => lexer.#emitReserved(UC_TOKEN_CLOSING_PARENTHESIS),
    ',': lexer => lexer.#emitReserved(UC_TOKEN_COMMA),
    '!': lexer => lexer.#emitReserved(UC_TOKEN_EXCLAMATION_MARK),
    '#': lexer => lexer.#emitReserved(UC_TOKEN_HASH),
    $: lexer => lexer.#emitReserved(UC_TOKEN_DOLLAR_SIGN),
    '&': lexer => lexer.#emitReserved(UC_TOKEN_AMPERSAND),
    "'": lexer => lexer.#emitReserved(UC_TOKEN_APOSTROPHE),
    '*': lexer => lexer.#emitReserved(UC_TOKEN_ASTERISK),
    '+': lexer => lexer.#emitReserved(UC_TOKEN_PLUS_SIGN),
    '/': lexer => lexer.#emitReserved(UC_TOKEN_SLASH),
    ':': lexer => lexer.#emitReserved(UC_TOKEN_COLON),
    ';': lexer => lexer.#emitReserved(UC_TOKEN_SEMICOLON),
    '=': lexer => lexer.#emitReserved(UC_TOKEN_EQUALS_SIGN),
    '?': lexer => lexer.#emitReserved(UC_TOKEN_QUESTION_MARK),
    '@': lexer => lexer.#emitReserved(UC_TOKEN_AT_SIGN),
    '[': lexer => lexer.#emitReserved(UC_TOKEN_OPENING_BRACKET),
    ']': lexer => lexer.#emitReserved(UC_TOKEN_CLOSING_BRACKET),
  };

  static readonly #paramTokens: { readonly [token: string]: (lexer: UcChargeLexer) => void } = {
    ...this.#ucTokens,
    '+': lexer => lexer.#addString(' '),
  };

  readonly #emit: (token: UcToken) => void;
  #tokens: { readonly [token: string]: (lexer: UcChargeLexer) => void } = UcChargeLexer.#ucTokens;
  #prev: string | typeof UC_TOKEN_CR | 0 = 0;

  /**
   * Constructs URI charge lexer.
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
      const emitter = this.#tokens[token];

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

/**
 * Enables processing of inset encoded with {@link UcChargeLexer URI Charge Notation}.
 *
 * @param options - Lexer options.
 *
 * @returns Schema constraints.
 */
export function ucInsetCharge(options?: {
  /**
   * Whether to decode _plus sign_ (`"+" (U+002B)`) as {@link UC_TOKEN_PREFIX_SPACE space padding}.
   *
   * @defaultValue `false`
   */
  readonly plusAsSpace?: boolean | undefined;
}): UcOmniConstraints;

export function ucInsetCharge({
  plusAsSpace,
}: {
  readonly plusAsSpace?: boolean | undefined;
} = {}): UcOmniConstraints {
  return {
    deserializer: {
      use: 'ucdSupportInset',
      from: COMPILER_MODULE,
      with: {
        lexer: 'UcChargeLexer',
        from: CHURI_MODULE,
        method: plusAsSpace ? 'plusAsSpace' : undefined,
      } satisfies UcdInsetOptions,
    },
  };
}
