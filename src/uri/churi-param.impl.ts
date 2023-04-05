import { isIterable } from '@proc7ts/primitives';
import { decodeSearchParam, encodeSearchParam } from '../impl/search-param-codec.js';
import { ChURIParamSplitter } from './churi-param-splitter.js';

export class ChURIParamValue {

  readonly #param: ChURIParam;
  readonly #index: number;

  constructor(param: ChURIParam, index: number) {
    this.#param = param;
    this.#index = index;
  }

  get key(): string {
    return this.#param.key;
  }

  get value(): string {
    return this.#param.values[this.#index];
  }

  get rawValue(): string {
    return this.#param.rawValues[this.#index];
  }

  toString(): string {
    return this.#param.rawKey + '=' + this.rawValue;
  }

}

export interface ChURIParam {
  get key(): string;
  get rawKey(): string;
  get values(): string[];
  get rawValues(): string[];
}

export function parseChURIParams(
  params: string,
  splitter: ChURIParamSplitter,
  list: ChURIParamValue[],
): [entries: Map<string, ChURIParam>, rawCharge: string | null] {
  if (splitter.prefix !== splitter.joiner && params.startsWith(splitter.prefix)) {
    params = params.slice(1);
  }

  const entries = new Map<string, ChURIParam$Parsed>();

  if (!params) {
    return [entries, null];
  }

  let isFirst = true;
  let rawCharge: string | null = null;

  for (const [rawKey, optionalValue] of splitter.split(params)) {
    if (isFirst) {
      isFirst = false;
      if (optionalValue == null) {
        // First parameter without value treated as parameters charge.
        rawCharge = rawKey;

        continue;
      }
    }

    const key = decodeSearchParam(rawKey);
    const value = optionalValue ?? '';
    const prev = entries.get(key);

    if (prev) {
      list.push(prev.add(value));
    } else {
      const param = new ChURIParam$Parsed(key, rawKey, value);

      entries.set(key, param);
      list.push(new ChURIParamValue(param, 0));
    }
  }

  return [entries, rawCharge];
}

export function provideChURIParams(
  params:
    | Iterable<readonly [string, (string | null)?]>
    | Readonly<Record<string, string | null | undefined>>,
  list: ChURIParamValue[],
): Map<string, ChURIParam> {
  const entries = new Map<string, ChURIParam$Provided>();

  for (const [key, val] of isIterable(params) ? params : Object.entries(params)) {
    const value = val ? String(val) : '';
    const prev = entries.get(key);

    if (prev) {
      list.push(prev.add(value));
    } else {
      const param = new ChURIParam$Provided(key, value);

      entries.set(key, param);
      list.push(new ChURIParamValue(param, 0));
    }
  }

  return entries;
}

class ChURIParam$Parsed implements ChURIParam {

  readonly #key: string;
  readonly #rawKey: string;
  readonly #rawValues: string[];

  #values?: string[];

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

  add(rawValue: string): ChURIParamValue {
    const index = this.#rawValues.length;

    this.#rawValues.push(rawValue);

    return new ChURIParamValue(this, index);
  }

}

class ChURIParam$Provided implements ChURIParam {

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

  add(value: string): ChURIParamValue {
    const index = this.#values.length;

    this.#values.push(value);

    return new ChURIParamValue(this, index);
  }

}
