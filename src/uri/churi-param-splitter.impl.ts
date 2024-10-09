import { ChURIParamSplitter } from './churi-param-splitter.js';

class ChURIParams$Splitter implements ChURIParamSplitter {
  readonly #prefix: string;
  readonly #joiner: string;
  readonly #splitter: RegExp;

  constructor(prefix: string, separator: string) {
    this.#prefix = prefix;
    this.#joiner = separator;
    this.#splitter = new RegExp(`(=|${separator}+)`);
  }

  get prefix(): string {
    return this.#prefix;
  }

  get joiner(): string {
    return this.#joiner;
  }

  *split(search: string): IterableIterator<readonly [string, string | null]> {
    const separator = this.#joiner;
    let key: string | null = null;
    let value: string | null = null;
    let isFirst = true;

    for (const part of search.split(this.#splitter)) {
      const wasFirst = isFirst;

      isFirst = false;
      if (part.startsWith(separator)) {
        if (key != null) {
          yield [key, value];
          key = null;
          value = null;
        }
      } else if (part === '=') {
        key ??= '';
        if (value != null) {
          value += part;
        } else {
          value = '';
        }
      } else if (part) {
        if (key == null) {
          key = part;
        } else if (value) {
          value += part;
        } else {
          value = part;
        }
      } else if (wasFirst) {
        yield ['', null];
      }
    }

    if (key != null) {
      yield [key, value];
    }
  }
}

export const ChURIAnchor$splitter = /*#__PURE__*/ new ChURIParams$Splitter('#', '&');
export const ChURIQuery$splitter = /*#__PURE__*/ new ChURIParams$Splitter('?', '&');
export const ChURIMatrix$splitter = /*#__PURE__*/ new ChURIParams$Splitter(';', ';');
