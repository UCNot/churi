import { UcLexer } from './uc-lexer.js';
import { UcToken } from './uc-token.js';

/**
 * A stream that transforms input chunks to URI charge {@link UcToken tokens}.
 *
 * Utilizes URI charge {@link UcLexer lexer} internally.
 */
export class UcLexerStream extends TransformStream<string, UcToken> {

  constructor(
    writableStrategy?: QueuingStrategy<string>,
    readableStrategy?: QueuingStrategy<UcToken>,
  ) {
    let tokenizer: UcLexer;

    super(
      {
        start: controller => {
          tokenizer = new UcLexer(token => controller.enqueue(token));
        },
        transform: chunk => tokenizer.scan(chunk),
        flush: () => tokenizer.flush(),
      },
      writableStrategy,
      readableStrategy,
    );
  }

}
