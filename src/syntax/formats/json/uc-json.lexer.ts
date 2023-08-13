import { UcLexer } from '../../uc-lexer.js';
import { UC_TOKEN_APOSTROPHE, UC_TOKEN_EXCLAMATION_MARK, UcToken } from '../../uc-token.js';

/**
 * JSON lexer.
 */
export class UcJSONLexer implements UcLexer {

  #state: UcJSON$State;

  /**
   * Constructs JSON lexer.
   *
   * @param emit - Emitter function called each time a token is found.
   */
  constructor(emit: (token: UcToken) => void) {
    this.#state = new UcJSON$State(emit);
  }

  scan(chunk: string): void {
    this.#state.scan(chunk);
  }

  flush(): void {
    this.#state.flush();
  }

}

class UcJSON$State {

  data = '';
  num = 0;
  #strategy: UcJSON$Strategy = UcJSON$Value;
  #stack: UcJSON$Strategy[] = [];

  constructor(readonly emit: (this: void, token: UcToken) => void) {}

  scan(chunk: string): void {
    this.#strategy.scan(this, chunk);
  }

  flush(): void {
    this.#strategy.flush(this);
    while (this.#stack.length) {
      this.#pop();
      this.#strategy.flush(this);
    }
  }

  next(strategy: UcJSON$Strategy): void {
    this.#strategy = strategy;
  }

  push(strategy: UcJSON$Strategy): void {
    this.#stack.push(this.#strategy);
    this.#strategy = strategy;
  }

  pop(tail: string): void {
    this.#pop();
    if (tail) {
      this.scan(tail);
    }
  }

  #pop(): void {
    this.#strategy = this.#stack.pop() ?? UcJSON$End;
  }

}

interface UcJSON$Strategy {
  scan(state: UcJSON$State, chunk: string): void;
  flush(state: UcJSON$State): void;
}

const UcJSON$NonWhitespacePattern = /[^ \r\n\t]/;
const UcJSON$NonDigitPattern = /[^\deE+-.]/;
const UcJSON$QuotePattern = /\\*(?:"|\\$)/;

function UcJSON$Number(pattern: RegExp): UcJSON$Strategy {
  const flush = (state: UcJSON$State): void => {
    const { data, emit } = state;

    if (!pattern.test(data)) {
      throw new SyntaxError(`Invalid JSON number: ${data}`);
    }

    emit(data);
    state.data = '';
  };

  return {
    scan(state: UcJSON$State, chunk: string): void {
      const end = chunk.search(UcJSON$NonDigitPattern);

      if (end < 0) {
        state.data += chunk;
      } else {
        state.data += chunk.slice(0, end);
        flush(state);
        state.pop(chunk.slice(end));
      }
    },

    flush,
  };
}

const UcJSON$String: UcJSON$Strategy = {
  scan(status: UcJSON$State, chunk: string): void {
    status.data = '"';
    status.next(UcJSON$StringBody);
    // Exclude leading quote.
    status.scan(chunk.slice(1));
  },
  flush: UcJSON$noFlush,
};

const UcJSON$StringBody: UcJSON$Strategy = {
  scan(state: UcJSON$State, chunk: string): void {
    let input = chunk;

    do {
      const match = UcJSON$QuotePattern.exec(input);

      if (match) {
        const [quote] = match;

        if (quote[quote.length - 1] === '"') {
          // Quote found, possibly escaped.

          const quoteEnd = match.index + quote.length;

          // May include preceding backslashes.
          const quoteLength = state.num + quote.length;

          if (quoteLength % 2) {
            // End of string.
            // Parse with built-in parser to handle escapes, etc.
            const value = JSON.parse(state.data + input.slice(0, quoteEnd)) as string;

            state.emit(UC_TOKEN_APOSTROPHE);
            if (value) {
              state.emit(value);
              state.data = '';
              state.num = 0;
            }

            state.pop(input.slice(quoteEnd));

            break;
          } else {
            // Quote is escaped.
            // Append the input up to the end of the quote.
            state.data += input.slice(0, quoteEnd);
            state.num = 0;

            // Continue with the rest of the input.
            input = input.slice(quoteEnd);
          }
        } else {
          // Trailing backslashes found, but not a quote.
          if (match.index) {
            // Some chars precede backslashes.
            // Set the number of trailing backslashes.
            state.num = match.length;
          } else {
            // The input consists of backslashes only.
            // Increase their number.
            state.num += quote.length;
          }

          state.data += input;

          break;
        }
      } else {
        // Neither quote, nor trailing escapes found.
        // Append the input as is.
        state.data += input;

        break;
      }
    } while (input);
  },

  flush: UcJSON$noFlush,
};

function UcJSON$Keyword(keyword: string, token: UcToken): UcJSON$Strategy {
  const length = keyword.length;

  return {
    scan(state: UcJSON$State, chunk: string): void {
      const charsLeft = length - state.data.length;

      if (chunk.length < charsLeft) {
        // Not enough characters.
        state.data += chunk;
      } else {
        // Keyword complete.
        const value = state.data + chunk.slice(0, charsLeft);

        if (value !== keyword) {
          throw new SyntaxError(`Unrecognized JSON value: ${value}`);
        }

        state.emit(token);
        state.data = '';
        state.pop(chunk.slice(charsLeft));
      }
    },
    flush: UcJSON$noFlush,
  };
}

const UcJSON$Value: UcJSON$Strategy = {
  scan(state: UcJSON$State, chunk: string): void {
    const start = chunk.search(UcJSON$NonWhitespacePattern);

    if (start >= 0) {
      const nextStrategy = UcJSON$StrategyByPrefix[chunk[start]];

      if (!nextStrategy) {
        throw new SyntaxError('JSON value expected');
      }

      state.next(nextStrategy);
      state.scan(chunk.slice(start));
    }
  },
  flush: UcJSON$noFlush,
};
const UcJSON$End: UcJSON$Strategy = {
  scan(_state, chunk) {
    if (UcJSON$NonWhitespacePattern.test(chunk)) {
      throw new SyntaxError('Excessive input after JSON');
    }
  },
  flush(_state) {},
};
const UcJSON$PositiveNumber = /*#__PURE__*/ UcJSON$Number(/^[1-9]\d*(?:\.\d+)?(?:[eE][+-]?\d+)?$/);

const UcJSON$StrategyByPrefix: {
  readonly [key in string]?: UcJSON$Strategy;
} = {
  '"': UcJSON$String,
  '-': /*#__PURE__*/ UcJSON$Number(/^-(?:0|[1-9]\d*)(?:.\d+)?(?:[eE][+-]?\d+)?$/),
  0: /*#__PURE__*/ UcJSON$Number(/^0(?:.\d+)?(?:[eE][+-]?\d+)?$/),
  1: UcJSON$PositiveNumber,
  2: UcJSON$PositiveNumber,
  3: UcJSON$PositiveNumber,
  4: UcJSON$PositiveNumber,
  5: UcJSON$PositiveNumber,
  6: UcJSON$PositiveNumber,
  7: UcJSON$PositiveNumber,
  8: UcJSON$PositiveNumber,
  9: UcJSON$PositiveNumber,
  f: /*#__PURE__*/ UcJSON$Keyword('false', '-'),
  n: /*#__PURE__*/ UcJSON$Keyword('null', '--'),
  t: /*#__PURE__*/ UcJSON$Keyword('true', UC_TOKEN_EXCLAMATION_MARK),
};

function UcJSON$noFlush(_state: UcJSON$State): void {
  throw new SyntaxError('Unexpected end of JSON input');
}
