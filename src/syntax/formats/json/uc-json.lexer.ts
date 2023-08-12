import { UcLexer } from '../../uc-lexer.js';
import { UcToken } from '../../uc-token.js';

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
  #strategy: UcJSON$Strategy = UcJSON$Value;
  #stack: UcJSON$Strategy[] = [];

  constructor(readonly emit: (this: void, token: UcToken) => void) {}

  scan(chunk: string): void {
    this.#strategy.scan(this, chunk);
  }

  flush(): void {
    this.#strategy.flush(this);
    while (this.#stack.length) {
      this.pop();
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

  pop(): void {
    this.#strategy = this.#stack.pop() ?? UcJSON$Value;
  }

}

abstract class UcJSON$Strategy {

  abstract scan(status: UcJSON$Status, chunk: string): void;

  flush(status: UcJSON$Status): void;
  flush(_status: UcJSON$Status): void {
    throw new TypeError('Unexpected end of JSON input');
  }

}

class UcJSON$ValueStrategy extends UcJSON$Strategy {

  override scan(status: UcJSON$Status, chunk: string): void {
    const start = chunk.search(UcJSON$NonWhitespacePattern);

    if (start >= 0) {
      const nextStrategy = UcJSON$StrategyByPrefix[chunk[start]];

      if (!nextStrategy) {
        throw new TypeError('JSON value expected');
      }

      status.next(nextStrategy);
      status.scan(chunk.slice(start));
    }
  }

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
      status.pop();
      status.scan(chunk.slice(end));
    }
  }

  override flush(status: UcJSON$Status): void {
    this.#emit(status);
  }

  #emit(status: UcJSON$Status): void {
    const { data, emit } = status;

    if (!this.#pattern.test(data)) {
      throw new TypeError(`Invalid JSON number: ${data}`);
    }

    emit(data);
    status.data = '';
  }

}

const UcJSON$NonWhitespacePattern = /[^ \r\n\t]/;
const UcJSON$NonDigitPattern = /[^\deE+-.]/;

const UcJSON$Value = /*#__PURE__*/ new UcJSON$ValueStrategy();
const UcJSON$PositiveNumber = /*#__PURE__*/ new UcJSON$NumberStrategy(
  /^[1-9]\d*(?:.\d+)?(?:[eE][+-]?\d+)?$/,
);

const UcJSON$StrategyByPrefix: { readonly [key in string]: UcJSON$Strategy | undefined } = {
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
};
