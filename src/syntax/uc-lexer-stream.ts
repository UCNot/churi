import { UcChargeLexer } from './lexers/uc-charge.lexer.js';
import { UcLexer } from './uc-lexer.js';
import { UcToken } from './uc-token.js';

/**
 * A stream that transforms input chunks to URI charge {@link UcToken tokens}.
 *
 * Utilizes URI charge {@link UcChargeLexer lexer} internally.
 */
export class UcLexerStream extends TransformStream<string, UcToken> {

  /**
   * Constructs lexer stream.
   *
   * @param createLexer - Creates an input lexer to use. By default, creates {@link UcChargeLexer} instance.
   * @param writableStrategy - An object that optionally defines a queuing strategy for the input (chunks) stream.
   * @param readableStrategy - An object that optionally defines a queuing strategy for the output (tokens) stream.
   */
  constructor(
    createLexer: (emit: (token: UcToken) => void) => UcLexer = UcLexerStream$createDefaultLexer,
    writableStrategy?: QueuingStrategy<string>,
    readableStrategy?: QueuingStrategy<UcToken>,
  ) {
    let lexer: UcLexer;

    super(
      {
        start: controller => {
          lexer = createLexer(token => controller.enqueue(token));
        },
        transform: chunk => lexer.scan(chunk),
        flush: () => lexer.flush(),
      },
      writableStrategy,
      readableStrategy,
    );
  }

}

function UcLexerStream$createDefaultLexer(emit: (token: UcToken) => void): UcLexer {
  return new UcChargeLexer(emit);
}
