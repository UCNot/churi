import { isIterable } from '@proc7ts/primitives';
import { URICharge } from '../charge/uri-charge.js';
import { decodeSearchParam, encodeSearchParam } from '../impl/search-param-codec.js';
import {
  UcMatrixParams$splitter,
  UcSearchParams$splitter,
} from '../impl/uc-search-params.splitter.js';
import { UcParamsCharge } from './uc-params-charge.js';
import type { UcRawParams } from './uc-raw-params.js';

/**
 * Charged search parameters representing a {@link ChURI#search query string} of the URI.
 *
 * Resembles standard [URLSearchParams class] in its read-only part.
 *
 * Allows to parse parameter values as {@link URICharge URI charge}.
 *
 * By default, expects search parameters to be in `application/x-www-form-urlencoded` format. This can be
 * {@link UcSearchParams.splitter customized} to support e.g. {@link UcMatrixParams matrix parameters}.
 *
 * [URLSearchParams class]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
 *
 * @typeParam TCharge - Parameters charge representation type. {@link UcParamsCharge} by default.
 */
export class UcSearchParams<out TCharge = UcParamsCharge> implements Iterable<[string, string]> {

  readonly #Charge: UcSearchParams.CustomOptions<TCharge>['Charge'];
  readonly #list: ChSearchParamValue[] = [];
  readonly #map: Map<string, ChSearchParam>;

  #raw?: UcRawParams;
  #charge?: TCharge;

  /**
   * Constructs search parameters.
   *
   * @param search - Either a string containing parameters to parse (a leading `"?" (U+OO3F)"` character is ignored),
   * an iterable of key/value pairs representing string parameter values, or a record of string keys and string values.
   * @param options - Initialization options.
   */
  constructor(
    search:
      | string
      | Iterable<readonly [string, (string | null)?]>
      | Readonly<Record<string, string | null | undefined>>,
    ...options: UcParamsCharge extends TCharge
      ? [UcSearchParams.DefaultOptions?]
      : [UcSearchParams.CustomOptions<TCharge>]
  );

  constructor(
    search:
      | string
      | Iterable<readonly [string, (string | null)?]>
      | Readonly<Record<string, string | null | undefined>>,
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Charge = UcParamsCharge as UcSearchParams.CustomOptions<TCharge>['Charge'],
    }: Partial<UcSearchParams.CustomOptions<TCharge>> = {},
  ) {
    this.#Charge = Charge;
    this.#map =
      typeof search === 'string'
        ? this.#parse(search)
        : this.#provide(isIterable(search) ? search : Object.entries(search));
  }

  /**
   * Search parameters splitter.
   *
   * Splits parameters separated by `"&" (U+0026)` symbol.
   */
  get splitter(): UcSearchParams.Splitter {
    return UcSearchParams$splitter;
  }

  /**
   * Raw parameter values.
   */
  get raw(): UcRawParams {
    return (this.#raw ??= new UcSearchParams$Raw(this, this.#list, this.#map));
  }

  /**
   * Parameters charge.
   */
  get charge(): TCharge {
    return (this.#charge ??= new this.#Charge(this as UcSearchParams));
  }

  #parse(search: string): Map<string, ChSearchParam> {
    if (search.startsWith('?')) {
      search = search.slice(1);
    }

    const entries = new Map<string, ChSearchParam$Parsed>();

    if (!search) {
      return entries;
    }

    for (const [rawKey, rawValue] of this.splitter.split(search)) {
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

  #provide(
    search: Iterable<readonly [string, (string | null | undefined)?]>,
  ): Map<string, ChSearchParam> {
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

  /**
   * Checks whether a parameter with the specified name present.
   *
   * @param name - Target parameter name.
   *
   * @returns `true` if parameter present, or `false` otherwise.
   *
   * @see [URLSearchParams.has()](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/has).
   */
  has(name: string): boolean {
    return this.#map.has(name);
  }

  /**
   * Obtains the first value associated to the given search parameter.
   *
   * @param name - Target parameter name.
   *
   * @returns A string if the given search parameter is found; otherwise, `null`.
   *
   * @see [URLSearchParams.get()](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/get).
   */
  get(name: string): string | null {
    const entry = this.#map.get(name);

    return entry ? entry.values[0] : null;
  }

  /**
   * Obtains all the values associated with a given search parameter as an array.
   *
   * @param name - Target parameter name.
   *
   * @returns An array of strings. Empty array if parameter absent.
   *
   * @see [URLSearchParams.getAll()](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/getAll).
   */
  getAll(name: string): string[] {
    const entry = this.#map.get(name);

    return entry ? entry.values.slice() : [];
  }

  /**
   * Iterates over all keys contained in this object. The keys are string objects.
   *
   * @returns An iterable iterator of parameter names in order of their appearance. Note that the same parameter name
   * may be reported multiple times.
   *
   * @see [URLSearchParams.keys()](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/keys).
   */
  *keys(): IterableIterator<string> {
    for (const { key } of this.#list) {
      yield key;
    }
  }

  /**
   * Iterates over all key/value pairs contained in this object. The key and value of each pair are string objects.
   *
   * @returns An iterable iterator of parameter name/value pairs in order of their appearance.
   *
   * @see [URLSearchParams.entries()](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/entries).
   */
  *entries(): IterableIterator<[string, string]> {
    for (const { key, value } of this.#list) {
      yield [key, value];
    }
  }

  /**
   * Iterates over all values values contained in this object. The values are string objects.
   *
   * @returns An iterable iterator of parameter values in order of their appearance.
   *
   * @see [URLSearchParams.values()](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/values).
   */
  *values(): IterableIterator<string> {
    for (const { value } of this.#list) {
      yield value;
    }
  }

  /**
   * Iterates over all values contained in this object via a callback function.
   *
   * @param callback - Function to execute on each element. Accepts parameter name, string parameter value, and `this`
   * instance as arguments.
   *
   * @see [URLSearchParams.forEach()](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/forEach).
   */
  forEach(callback: (value: string, key: string, parent: UcSearchParams<TCharge>) => void): void {
    this.#list.forEach(({ key, value }) => callback(value, key, this));
  }

  /**
   * Iterates over all key/value pairs contained in this object. The key and value of each pair are string objects.
   *
   * The same as {@link entries}.
   *
   * @returns An iterable iterator of parameter name/value pairs in order of their appearance.
   */
  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  /**
   * Builds a query string.
   *
   * @returns The string containing parameters joined with {@link UcSearchParams.Splitter#joiner joiner} symbol.
   */
  toString(): string {
    return this.#list.join(this.splitter.joiner);
  }

}

export namespace UcSearchParams {
  export interface DefaultOptions {
    readonly Charge?: (new (params: UcSearchParams) => UcParamsCharge) | undefined;
  }

  export interface CustomOptions<out TCharge> {
    readonly Charge: new (params: UcSearchParams) => TCharge;
  }

  /**
   * {@link UcSearchParams search parameters} splitter.
   */
  export interface Splitter {
    /**
     * Symbol used to join search parameters.
     *
     * @defaultValue `"&" (U+0026)`
     */
    readonly joiner: string;

    /**
     * Splits search string onto parameter key/value pairs.
     *
     * By default, splits `&`-separated
     *
     * @param search - Search string to split.
     *
     * @returns Iterable of URI-encoded key/value pairs.
     */
    split(search: string): Iterable<readonly [string, string]>;
  }
}

class UcSearchParams$Raw implements UcRawParams {

  readonly #params: UcSearchParams<unknown>;
  readonly #list: ChSearchParamValue[] = [];
  readonly #map: Map<string, ChSearchParam>;

  constructor(
    params: UcSearchParams<unknown>,
    list: ChSearchParamValue[],
    map: Map<string, ChSearchParam>,
  ) {
    this.#params = params;
    this.#list = list;
    this.#map = map;
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

  forEach(callback: (value: string, key: string, parent: UcRawParams) => void): void {
    this.#list.forEach(({ key, rawValue }) => callback(rawValue, key, this));
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  toString(): string {
    return this.#list.join(this.#params.splitter.joiner);
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

  get rawValue(): string {
    return this.#param.rawValues[this.#index];
  }

  toString(): string {
    return this.#param.rawKey + '=' + this.rawValue;
  }

}

interface ChSearchParam {
  get key(): string;
  get rawKey(): string;
  get values(): string[];
  get rawValues(): string[];
}

class ChSearchParam$Parsed implements ChSearchParam {

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

/**
 * Charged matrix URI parameters representation.
 *
 * In contrast to {@link UcSearchParams search parameters}, uses `";" (U+003B)` as separator.
 *
 * @typeParam TCharge - Parameters charge representation type. {@link UcParamsCharge} by default.
 */
export class UcMatrixParams<out TCharge = UcParamsCharge> extends UcSearchParams<TCharge> {

  /**
   * Matrix parameters splitter.
   *
   * Splits parameters separated by `";" (U+003B)` symbol.
   */
  override get splitter(): UcSearchParams.Splitter {
    return UcMatrixParams$splitter;
  }

}
