import { UcInputLexer } from '../uc-input-lexer.js';

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
