import { UcLexer } from '../uc-lexer.js';

/**
 * Charge input lexer that ignores the input.
 */

export const ucOpaqueLexer: UcLexer = {
  scan(_chunk) {
    // Ignore input.
  },
  flush() {
    // Nothing to flush.
  },
};
