import { isIterable } from '@proc7ts/primitives';
import { decodeSearchParam, encodeSearchParam } from './impl/search-param-codec.js';

export class ChSearchParams implements Iterable<[string, string]> {

  readonly #list: ChSearchParamValue[] = [];
  readonly #map: Map<string, ChSearchParam>;

  constructor(
    search:
      | string
      | Iterable<readonly [string, (string | null)?]>
      | Readonly<Record<string, string | null | undefined>>,
  ) {
    this.#map =
      typeof search === 'string'
        ? this.#parse(search)
        : this.#provide(isIterable(search) ? search : Object.entries(search));
  }

  #parse(search: string): Map<string, ChSearchParam> {
    if (search.startsWith('?')) {
      search = search.slice(1);
    }

    const entries = new Map<string, ChSearchParam$Parsed>();

    if (!search) {
      return entries;
    }

    for (const part of search.split('&')) {
      const [rawKey, rawValue = ''] = part.split('=', 2);
      const key = decodeSearchParam(rawKey);
      const prev = entries.get(key);

      if (prev) {
        this.#list.push(prev.add(rawValue));
      } else {
        const param = new ChSearchParam$Parsed(key, rawKey, rawValue);

        entries.set(key, param);
        this.#list.push(new ChSearchParamValue(param, 0));
      }
    }

    return entries;
  }

  #provide(search: Iterable<readonly [string, (string | null)?]>): Map<string, ChSearchParam> {
    const entries = new Map<string, ChSearchParam$Provided>();

    for (const [key, val] of search) {
      const value = val ? String(val) : '';
      const prev = entries.get(key);

      if (prev) {
        this.#list.push(prev.add(value));
      } else {
        const param = new ChSearchParam$Provided(key, value);

        entries.set(key, param);
        this.#list.push(new ChSearchParamValue(param, 0));
      }
    }

    return entries;
  }

  has(name: string): boolean {
    return this.#map.has(name);
  }

  get(name: string): string | null {
    const entry = this.#map.get(name);

    return entry ? entry.values[0] : null;
  }

  getAll(name: string): string[] {
    const entry = this.#map.get(name);

    return entry ? entry.values.slice() : [];
  }

  *keys(): IterableIterator<string> {
    for (const { key } of this.#list) {
      yield key;
    }
  }

  *entries(): IterableIterator<[string, string]> {
    for (const { key, value } of this.#list) {
      yield [key, value];
    }
  }

  *values(): IterableIterator<string> {
    for (const { value } of this.#list) {
      yield value;
    }
  }

  forEach(callback: (value: string, key: string, parent: ChSearchParams) => void): void {
    this.#list.forEach(({ key, value }) => callback(value, key, this));
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  toString(): string {
    return this.#list.join('&');
  }

}

class ChSearchParamValue {

  readonly #param: ChSearchParam;
  readonly #index: number;

  constructor(param: ChSearchParam, index: number) {
    this.#param = param;
    this.#index = index;
  }

  get key(): string {
    return this.#param.key;
  }

  get value(): string {
    return this.#param.values[this.#index];
  }

  toString(): string {
    return this.#param.rawKey + '=' + this.#param.rawValues[this.#index];
  }

}

interface ChSearchParam {
  readonly key: string;
  readonly rawKey: string;
  readonly values: string[];
  readonly rawValues: string[];
}

class ChSearchParam$Parsed implements ChSearchParam {

  readonly #key: string;
  readonly #rawKey: string;
  #values?: string[];
  readonly #rawValues: string[];

  constructor(key: string, rawKey: string, rawValue: string) {
    this.#key = key;
    this.#rawKey = rawKey;
    this.#rawValues = [rawValue];
  }

  get key(): string {
    return this.#key;
  }

  get rawKey(): string {
    return this.#rawKey;
  }

  get values(): string[] {
    return (this.#values ??= this.#rawValues.map(decodeSearchParam));
  }

  get rawValues(): string[] {
    return this.#rawValues;
  }

  add(rawValue: string): ChSearchParamValue {
    const index = this.#rawValues.length;

    this.#rawValues.push(rawValue);

    return new ChSearchParamValue(this, index);
  }

}

class ChSearchParam$Provided implements ChSearchParam {

  readonly #key: string;
  readonly #values: string[];

  #rawKey?: string;
  #rawValues?: string[];

  constructor(key: string, value: string) {
    this.#key = key;
    this.#values = [value];
  }

  get key(): string {
    return this.#key;
  }

  get rawKey(): string {
    return (this.#rawKey ??= decodeSearchParam(this.#key));
  }

  get values(): string[] {
    return this.#values;
  }

  get rawValues(): string[] {
    return (this.#rawValues ??= this.#values.map(encodeSearchParam));
  }

  add(value: string): ChSearchParamValue {
    const index = this.#values.length;

    this.#values.push(value);

    return new ChSearchParamValue(this, index);
  }

}
