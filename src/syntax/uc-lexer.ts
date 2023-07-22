/**
 * Lexer splits the input onto tokens.
 *
 * The input chunks {@link UcLexer#scan scanned} by lexer one at a time. Each token found is emitted by calling
 * provided emitter. On completion, the input has to by {@link UcLexer#flush flushed} in order to process the
 * remaining input.
 */
export interface UcLexer {
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
