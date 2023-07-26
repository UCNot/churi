import { UcLexer } from './uc-lexer.js';
import { UcToken } from './uc-token.js';

/**
 * Scans the `input` for URI charge {@link UcToken tokens}.
 *
 * @param createLexer - Creates lexer.
 * @param input - Array of input chunks to scan.
 *
 * @returns Array of tokens.
 */
export function scanUcTokens(
  createLexer: (
    /**
     * Emitter function called each time a is token found.
     */
    emit: (token: UcToken) => void,
  ) => UcLexer,
  ...input: string[]
): UcToken[] {
  const tokens: UcToken[] = [];
  const lexer = createLexer(token => tokens.push(token));

  for (const chunk of input) {
    lexer.scan(chunk);
  }
  lexer.flush();

  return tokens;
}
