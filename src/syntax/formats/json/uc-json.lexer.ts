import { UcLexer } from '../../uc-lexer.js';
import {
  UC_TOKEN_APOSTROPHE,
  UC_TOKEN_CLOSING_PARENTHESIS,
  UC_TOKEN_COMMA,
  UC_TOKEN_EXCLAMATION_MARK,
  UC_TOKEN_OPENING_PARENTHESIS,
  UcToken,
} from '../../uc-token.js';

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
    this.#state.scan(0, chunk);
  }

  flush(): void {
    this.#state.flush();
  }

}

class UcJSON$State {

  data = '';
  num = 0;
  #strategy: UcJSON$Strategy = UcJSON$TopLevel;
  #stack: UcJSON$Strategy[] = [];

  constructor(readonly emit: (this: void, token: UcToken) => void) {}

  scan(from: number, chunk: string): void {
    this.#strategy.scan(this, from, chunk);
  }

  #scan(from: number, chunk: string): void {
    if (from < chunk.length) {
      this.scan(from, chunk);
    }
  }

  flush(): void {
    this.#strategy.flush(this);
    while (this.#stack.length) {
      this.#pop();
      this.#strategy.flush(this);
    }
  }

  next(strategy: UcJSON$Strategy, from: number, tail: string): void {
    this.#strategy = strategy;
    this.#scan(from, tail);
  }

  push(strategy: UcJSON$Strategy, from: number, tail: string, endStrategy: UcJSON$Strategy): void {
    this.#stack.push(endStrategy);
    this.#strategy = strategy;
    this.#scan(from, tail);
  }

  select(chunk: string, selector: UcJSON$StrategySelector, endStrategy: UcJSON$Strategy): void {
    const start = chunk.search(UcJSON$NonWhitespacePattern);

    if (start >= 0) {
      const selected = selector[chunk[start]];

      if (!selected) {
        throw new SyntaxError('JSON value expected');
      }

      this.push(selected, start, chunk, endStrategy);
    }
  }

  pop(from: number, tail: string): void {
    this.#pop();
    this.#scan(from, tail);
  }

  pop2(from: number, tail: string): void {
    this.#pop();
    this.pop(from, tail);
  }

  #pop(): void {
    this.#strategy = this.#stack.pop()!;
  }

}

interface UcJSON$Strategy {
  scan(state: UcJSON$State, from: number, chunk: string): void;
  flush(state: UcJSON$State): void;
}

interface UcJSON$StrategySelector {
  [key: string]: UcJSON$Strategy | undefined;
}

const UcJSON$NonWhitespacePattern = /[^ \r\n\t]/;
const UcJSON$NonDigitPattern = /[^\deE+\-.]/;
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
    scan(state, from, chunk) {
      const input = chunk.slice(from);
      const end = input.search(UcJSON$NonDigitPattern);

      if (end < 0) {
        state.data += input;
      } else {
        state.data += chunk.slice(from, from + end);
        flush(state);
        state.pop(from + end, chunk);
      }
    },

    flush,
  };
}

const UcJSON$String: UcJSON$Strategy = {
  scan(state, from, chunk) {
    state.data = '"';
    // Exclude leading quote.
    state.next(UcJSON$String$Body, from + 1, chunk);
  },
  flush: UcJSON$noFlush,
};

const UcJSON$String$Body: UcJSON$Strategy = {
  scan(state, from, chunk) {
    let input = chunk.slice(from);

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

            state.pop(quoteEnd, input);

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
    scan(state, from, chunk) {
      const charsLeft = length - state.data.length;

      if (chunk.length - from < charsLeft) {
        // Not enough characters.
        state.data += chunk.slice(from);
      } else {
        // Keyword complete.
        const value = state.data + chunk.slice(from, from + charsLeft);

        if (value !== keyword) {
          throw new SyntaxError(`Unrecognized JSON value: ${value}`);
        }

        state.emit(token);
        state.data = '';
        state.pop(from + charsLeft, chunk);
      }
    },
    flush: UcJSON$noFlush,
  };
}

function UcJSON$Array(nested: boolean): UcJSON$Strategy {
  const end: (state: UcJSON$State) => void = nested
    ? state => {
        state.emit(UC_TOKEN_CLOSING_PARENTHESIS);
      }
    : _state => {};
  const empty: UcJSON$Strategy = {
    scan(state, from, chunk) {
      end(state);
      // Skip closing bracket.
      state.pop2(from + 1, chunk);
    },
    flush: UcJSON$noFlush,
  };
  const selector: UcJSON$StrategySelector = {
    ...UcJSON$BaseSelector,
    ']': empty,
  };
  const start = nested ? UC_TOKEN_OPENING_PARENTHESIS : UC_TOKEN_COMMA;

  const elementEnd: UcJSON$Strategy = {
    scan(state, from, chunk) {
      const start = chunk.slice(from).search(UcJSON$NonWhitespacePattern);

      if (start >= 0) {
        const prefix = chunk[from + start];

        switch (prefix) {
          case ',':
            state.emit(UC_TOKEN_COMMA);
            state.select(chunk.slice(from + start + 1), selector, this);

            break;
          case ']':
            end(state);
            state.pop(from + start + 1, chunk);

            break;
          default:
            throw new SyntaxError('Malformed JSON array');
        }
      }
    },
    flush: UcJSON$noFlush,
  };
  const body: UcJSON$Strategy = {
    scan(state, from, chunk) {
      state.select(chunk.slice(from), selector, elementEnd);
    },
    flush: UcJSON$noFlush,
  };

  const strategy: UcJSON$Strategy = {
    scan(state, from, chunk) {
      state.emit(start);
      // Skip opening bracket.
      state.next(body, from + 1, chunk);
    },
    flush: UcJSON$noFlush,
  };

  selector['['] = nested ? strategy : UcJSON$Array(true);

  return strategy;
}

const UcJSON$TopLevel: UcJSON$Strategy = {
  scan(state, from, chunk) {
    state.select(chunk.slice(from), UcJSON$Value$Next, UcJSON$End);
  },
  flush: UcJSON$noFlush,
};

const UcJSON$End: UcJSON$Strategy = {
  scan(_state, from, chunk) {
    if (UcJSON$NonWhitespacePattern.test(chunk.slice(from))) {
      throw new SyntaxError('Excessive input after JSON');
    }
  },
  flush(_state) {},
};

const UcJSON$PositiveNumber = /*#__PURE__*/ UcJSON$Number(/^[1-9]\d*(?:\.\d+)?(?:[eE][+-]?\d+)?$/);

const UcJSON$BaseSelector: UcJSON$StrategySelector = {
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

const UcJSON$Value$Next: UcJSON$StrategySelector = {
  ...UcJSON$BaseSelector,
  '[': /*#__PURE__*/ UcJSON$Array(false),
};

function UcJSON$noFlush(_state: UcJSON$State): void {
  throw new SyntaxError('Unexpected end of JSON input');
}
