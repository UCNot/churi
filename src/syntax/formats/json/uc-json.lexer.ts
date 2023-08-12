import { isEscapedUcString } from '../../../impl/uc-string-escapes.js';
import { UcLexer } from '../../uc-lexer.js';
import { UC_TOKEN_APOSTROPHE, UC_TOKEN_EXCLAMATION_MARK, UcToken } from '../../uc-token.js';

export class UcJSONLexer implements UcLexer {

  #status: UcJSON$Status;

  constructor(emit: (token: UcToken) => void) {
    this.#status = new UcJSON$Status(emit);
  }

  scan(chunk: string): void {
    this.#status.scan(chunk);
  }

  flush(): void {
    this.#status.flush();
  }

}

class UcJSON$Status {

  data = '';
  num = 0;
  #strategy: UcJSON$Strategy = UcJSON$Initial;
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
    this.#strategy = this.#stack.pop() ?? UcJSON$Value;
  }

}

abstract class UcJSON$Strategy {

  abstract scan(status: UcJSON$Status, chunk: string): void;

  flush(status: UcJSON$Status): void;
  flush(_status: UcJSON$Status): void {
    throw new SyntaxError('Unexpected end of JSON input');
  }

}

class UcJSON$InitialStrategy extends UcJSON$Strategy {

  override scan(status: UcJSON$Status, chunk: string): void {
    const start = chunk.search(UcJSON$NonWhitespacePattern);

    if (start >= 0) {
      const nextStrategy = UcJSON$StrategyByPrefix[chunk[start]];

      if (!nextStrategy) {
        throw new SyntaxError('JSON value expected');
      }

      status.next(nextStrategy);
      status.scan(chunk.slice(start));
    }
  }

}

class UcJSON$ValueStrategy extends UcJSON$InitialStrategy {

  override flush(_status: UcJSON$Status): void {}

}

class UcJSON$NumberStrategy extends UcJSON$Strategy {

  readonly #pattern: RegExp;

  constructor(pattern: RegExp) {
    super();
    this.#pattern = pattern;
  }

  override scan(status: UcJSON$Status, chunk: string): void {
    const end = chunk.search(UcJSON$NonDigitPattern);

    if (end < 0) {
      status.data += chunk;
    } else {
      status.data += chunk.slice(0, end);
      this.#emit(status);
      status.pop(chunk.slice(end));
    }
  }

  override flush(status: UcJSON$Status): void {
    this.#emit(status);
  }

  #emit(status: UcJSON$Status): void {
    const { data, emit } = status;

    if (!this.#pattern.test(data)) {
      throw new SyntaxError(`Invalid JSON number: ${data}`);
    }

    emit(data);
    status.data = '';
  }

}

class UcJSON$StringBodyStrategy extends UcJSON$Strategy {

  override scan(status: UcJSON$Status, chunk: string): void {
    let input = chunk;

    do {
      const match = UcJSON$QuotePattern.exec(input);

      if (match) {
        const [quote] = match;

        if (quote[quote.length - 1] === '"') {
          // Quote found, possibly escaped.

          const quoteEnd = match.index + quote.length;

          // May include preceding backslashes.
          const quoteLength = status.num + quote.length;

          if (quoteLength % 2) {
            // End of string.
            // Parse with built-in parser to handle escapes, etc.
            const value = JSON.parse(status.data + input.slice(0, quoteEnd)) as string;

            if (isEscapedUcString(value)) {
              status.emit(UC_TOKEN_APOSTROPHE);
            }
            status.emit(value);

            status.data = '';
            status.num = 0;
            status.pop(input.slice(quoteEnd));

            break;
          } else {
            // Quote is escaped.
            // Append the input up to the end of the quote.
            status.data += input.slice(0, quoteEnd);
            status.num = 0;

            // Continue with the rest of the input.
            input = input.slice(quoteEnd);
          }
        } else {
          // Trailing backslashes found, but not a quote.
          if (match.index) {
            // Some chars precede backslashes.
            // Set the number of trailing backslashes.
            status.num = match.length;
          } else {
            // The input consists of backslashes only.
            // Increase their number.
            status.num += quote.length;
          }

          status.data += input;

          break;
        }
      } else {
        // Neither quote, nor trailing escapes found.
        // Append the input as is.
        status.data += input;

        break;
      }
    } while (input);
  }

}

class UcJSON$StringStrategy extends UcJSON$Strategy {

  readonly #body = new UcJSON$StringBodyStrategy();

  override scan(status: UcJSON$Status, chunk: string): void {
    status.data = '"';
    status.next(this.#body);
    // Exclude leading quote.
    status.scan(chunk.slice(1));
  }

}

class UcJSON$KeywordStrategy extends UcJSON$Strategy {

  readonly #keyword: string;
  readonly #length: number;
  readonly #token: UcToken;

  constructor(keyword: string, token: UcToken) {
    super();
    this.#keyword = keyword;
    this.#length = keyword.length;
    this.#token = token;
  }

  override scan(status: UcJSON$Status, chunk: string): void {
    const charsLeft = this.#length - status.data.length;

    if (chunk.length < charsLeft) {
      // Not enough characters.
      status.data += chunk;
    } else {
      // Keyword complete.
      const value = status.data + chunk.slice(0, charsLeft);

      if (value !== this.#keyword) {
        throw new SyntaxError(`Unrecognized JSON value: ${value}`);
      }

      status.emit(this.#token);
      status.data = '';
      status.pop(chunk.slice(charsLeft));
    }
  }

}

const UcJSON$NonWhitespacePattern = /[^ \r\n\t]/;
const UcJSON$NonDigitPattern = /[^\deE+-.]/;
const UcJSON$QuotePattern = /\\*(?:"|\\$)/;

const UcJSON$Initial = /*#__PURE__*/ new UcJSON$InitialStrategy();
const UcJSON$Value = /*#__PURE__*/ new UcJSON$ValueStrategy();
const UcJSON$PositiveNumber = /*#__PURE__*/ new UcJSON$NumberStrategy(
  /^[1-9]\d*(?:\.\d+)?(?:[eE][+-]?\d+)?$/,
);

const UcJSON$StrategyByPrefix: {
  readonly [key in string]?: UcJSON$Strategy;
} = {
  '"': /*#__PURE__*/ new UcJSON$StringStrategy(),
  '-': /*#__PURE__*/ new UcJSON$NumberStrategy(/^-(?:0|[1-9]\d*)(?:.\d+)?(?:[eE][+-]?\d+)?$/),
  0: /*#__PURE__*/ new UcJSON$NumberStrategy(/^0(?:.\d+)?(?:[eE][+-]?\d+)?$/),
  1: UcJSON$PositiveNumber,
  2: UcJSON$PositiveNumber,
  3: UcJSON$PositiveNumber,
  4: UcJSON$PositiveNumber,
  5: UcJSON$PositiveNumber,
  6: UcJSON$PositiveNumber,
  7: UcJSON$PositiveNumber,
  8: UcJSON$PositiveNumber,
  9: UcJSON$PositiveNumber,
  f: /*#__PURE__*/ new UcJSON$KeywordStrategy('false', '-'),
  n: /*#__PURE__*/ new UcJSON$KeywordStrategy('null', '--'),
  t: /*#__PURE__*/ new UcJSON$KeywordStrategy('true', UC_TOKEN_EXCLAMATION_MARK),
};
