import { UcToken } from './uc-token.js';
import { UcTokenizer } from './uc-tokenizer.js';

/**
 * A stream that transforms input strings to URI charge {@link UcToken tokens}.
 *
 * Utilizes URI charge {@link UcTokenizer tokenizer} internally.
 */
export class UcTokenizerStream extends TransformStream<string, UcToken> {

  constructor(
    writableStrategy?: QueuingStrategy<string>,
    readableStrategy?: QueuingStrategy<UcToken>,
  ) {
    let tokenizer: UcTokenizer;

    super(
      {
        start: controller => {
          tokenizer = new UcTokenizer(token => controller.enqueue(token));
        },
        transform: chunk => tokenizer.split(chunk),
        flush: () => tokenizer.flush(),
      },
      writableStrategy,
      readableStrategy,
    );
  }

}
