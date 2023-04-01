import { UcSearchParams } from '../uri/uc-search-params.js';

class UcSearchParams$Splitter implements UcSearchParams.Splitter {

  readonly #joiner: string;
  readonly #splitter: RegExp;

  constructor(separator: string) {
    this.#joiner = separator;
    this.#splitter = new RegExp(`(=|${separator}+)`);
  }

  get joiner(): string {
    return this.#joiner;
  }

  *split(search: string): IterableIterator<readonly [string, string]> {
    const separator = this.#joiner;
    let key: string | null = null;
    let value: string | null = null;

    for (const part of search.split(this.#splitter)) {
      if (part.startsWith(separator)) {
        if (key != null) {
          yield [key, value ?? ''];
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
      }
    }

    if (key != null) {
      yield [key, value ?? ''];
    }
  }

}

export const UcSearchParams$splitter = /*#__PURE__*/ new UcSearchParams$Splitter('&');
export const UcMatrixParams$splitter = /*#__PURE__*/ new UcSearchParams$Splitter(';');
