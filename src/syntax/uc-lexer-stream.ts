import { UcInputLexer } from './uc-input-lexer.js';
import { UcLexer } from './uc-lexer.js';
import { UcToken } from './uc-token.js';

/**
 * A stream that transforms input chunks to URI charge {@link UcToken tokens}.
 *
 * Utilizes URI charge {@link UcLexer lexer} internally.
 */
export class UcLexerStream extends TransformStream<string, UcToken> {

  /**
   * Constructs lexer stream.
   *
   * @param createLexer - Creates an input lexer to use. By default, creates {@link UcLexer} instance.
   * @param writableStrategy - An object that optionally defines a queuing strategy for the input (chunks) stream.
   * @param readableStrategy - An object that optionally defines a queuing strategy for the output (tokens) stream.
   */
  constructor(
    createLexer: (
      emit: (token: UcToken) => void,
    ) => UcInputLexer = UcLexerStream$createDefaultLexer,
    writableStrategy?: QueuingStrategy<string>,
    readableStrategy?: QueuingStrategy<UcToken>,
  ) {
    let lexer: UcInputLexer;

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

function UcLexerStream$createDefaultLexer(emit: (token: UcToken) => void): UcInputLexer {
  return new UcLexer(emit);
}
