import { UcToken } from './uc-token.js';

/**
 * Charge lexer that splits the input onto tokens.
 *
 * The input chunks {@link UcInputLexer#scan scanned} by lexer one at a time. Each token found is emitted by calling
 * provided emitter. On completion, the input has to by {@link UcInputLexer#flush flushed} in order to process the
 * remaining input.
 */
export interface UcInputLexer {
  /**
   * Scans the input `chunk` for tokens.
   *
   * @param chunk - Chunk of input to scan.
   */
  scan(chunk: string): void;

  /**
   * Flushes the input emitting all pending tokens.
   */
  flush(): void;
}

/**
 * Charge input lexer that ignores the input.
 */
export const ucOpaqueLexer: UcInputLexer = {
  scan(_chunk) {
    // Ignore input.
  },
  flush() {
    // Nothing to flush.
  },
};

/**
 * Factory for {@link UcInputLexer input lexer}.
 *
 * @param emit - Emitter function called each time a token is found.
 *
 * @returns New lexer instance.
 */
export type UcInputLexerFactory = (emit: (token: UcToken) => void) => UcInputLexer;
