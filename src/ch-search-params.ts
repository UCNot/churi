import { isIterable } from '@proc7ts/primitives';
import { decodeSearchParam, encodeSearchParam } from './impl/search-param-codec.js';

export class ChSearchParams implements Iterable<[string, string]> {

  readonly #list: [string, string][] = [];
  readonly #map = new Map<string, string[]>();

  constructor(
    search:
      | string
      | Iterable<readonly [string, (string | null)?]>
      | Readonly<Record<string, string | null | undefined>>,
  ) {
    let entries: Iterable<readonly [string, (unknown | null)?]>;

    if (typeof search === 'string') {
      if (search.startsWith('?')) {
        search = search.slice(1);
      }
      if (!search) {
        return;
      }

      entries = search.split('&').map((part) => {
        const [key, value] = part.split('=', 2);

        return [decodeSearchParam(key), value ? decodeSearchParam(value) : '']
    });
    } else if (isIterable(search)) {
      entries = search;
    } else {
      entries = Object.entries(search);
    }

    for (const [name, val] of entries) {
      const value = val ? String(val) : '';

      this.#list.push([name, value]);

      const prev = this.#map.get(name);

      if (prev) {
        prev.push(value);
      } else {
        this.#map.set(name, [value]);
      }
    }
  }

  has(name: string): boolean {
    return this.#map.has(name);
  }

  get(name: string): string | null {
    const values = this.#map.get(name);

    return values ? values[0] : null;
  }

  getAll(name: string): string[] {
    const values = this.#map.get(name);

    return values ? values.slice() : [];
  }

  *keys(): IterableIterator<string> {
    for (const [key] of this.#list) {
      yield key;
    }
  }

  *entries(): IterableIterator<[string, string]> {
    for (const [key, value] of this.#list) {
      yield [key, value];
    }
  }

  *values(): IterableIterator<string> {
    for (const [, value] of this.#list) {
      yield value;
    }
  }

  forEach(callback: (value: string, key: string, parent: ChSearchParams) => void): void {
    this.#list.forEach(([key, value]) => callback(value, key, this));
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  toString(): string {
    let out = '';

    for (const [key, value] of this.#list) {
      if (out) {
        out += '&';
      }
      out += encodeSearchParam(key) + '=' + encodeSearchParam(value);
    }

    return out;
  }

}
