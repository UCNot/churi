import { ChURIParam, ChURIParamValue } from './churi-param.impl.js';
import { ChURIParams } from './churi-params.js';
import { ChURIRawParams } from './churi-raw-params.js';

export class ChURIParams$Raw implements ChURIRawParams {

  readonly #arg: string | null;
  readonly #params: ChURIParams<unknown>;
  readonly #list: ChURIParamValue[] = [];
  readonly #map: Map<string, ChURIParam>;

  constructor(
    params: ChURIParams<unknown>,
    arg: string | null,
    list: ChURIParamValue[],
    map: Map<string, ChURIParam>,
  ) {
    this.#arg = arg;
    this.#params = params;
    this.#list = list;
    this.#map = map;
  }

  get arg(): string | null {
    return this.#arg;
  }

  has(name: string): boolean {
    return this.#map.has(name);
  }

  get(name: string): string | null {
    const entry = this.#map.get(name);

    return entry ? entry.rawValues[0] : null;
  }

  getAll(name: string): string[] {
    const entry = this.#map.get(name);

    return entry ? entry.rawValues.slice() : [];
  }

  *keys(): IterableIterator<string> {
    for (const { key } of this.#list) {
      yield key;
    }
  }

  *entries(): IterableIterator<[string, string]> {
    for (const { key, rawValue } of this.#list) {
      yield [key, rawValue];
    }
  }

  *values(): IterableIterator<string> {
    for (const { rawValue } of this.#list) {
      yield rawValue;
    }
  }

  forEach(callback: (value: string, key: string, parent: ChURIRawParams) => void): void {
    this.#list.forEach(({ key, rawValue }) => callback(rawValue, key, this));
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  toString(): string {
    return this.#list.join(this.#params.splitter.joiner);
  }

}
