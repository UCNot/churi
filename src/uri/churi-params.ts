import { ChURIMatrix$splitter, ChURIQuery$splitter } from './churi-param-splitter.impl.js';
import { ChURIParamSplitter } from './churi-param-splitter.js';
import {
  ChURIParam,
  ChURIParamValue,
  parseChURIParams,
  provideChURIParams,
} from './churi-param.impl.js';
import { ChURIParamsCharge } from './churi-params-charge.js';
import { ChURIParams$Raw } from './churi-raw-params.impl.js';
import { ChURIRawParams } from './churi-raw-params.js';

/**
 * Abstract parameters of {@link ChURI charged URI}. A base class for {@link ChURIQuery search parameters},
 * {@link UcMatrixParams matrix parameters}, and {@link ChURIAnchor hash parameters}.
 *
 * Resembles standard [URLSearchParams class] in its read-only part.
 *
 * [URLSearchParams class]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
 *
 * @typeParam TCharge - Parameters charge representation type. {@link ChURIParamsCharge} by default.
 */
export abstract class ChURIParams<out TCharge = ChURIParamsCharge>
  implements Iterable<[string, string]> {

  readonly #Charge: ChURIParams.CustomOptions<TCharge>['Charge'];
  readonly #list: ChURIParamValue[] = [];
  readonly #map: Map<string, ChURIParam>;
  readonly #rawCharge: string | null;

  #raw?: ChURIRawParams;
  #charge?: TCharge;

  /**
   * Constructs search parameters.
   *
   * @param params - Either a string containing parameters to parse (a leading `"?" (U+OO3F)"` character is ignored),
   * an iterable of key/value pairs representing string parameter values, or a record of string keys and string values.
   * @param options - Initialization options.
   */
  constructor(
    params:
      | string
      | Iterable<readonly [string, (string | null)?]>
      | Readonly<Record<string, string | null | undefined>>,
    ...options: ChURIParamsCharge extends TCharge
      ? [ChURIParams.DefaultOptions?]
      : [ChURIParams.CustomOptions<TCharge>]
  );

  /**
   * Constructs search parameters.
   *
   * @param params - Either a string containing parameters to parse (a leading `"?" (U+OO3F)"` character is ignored),
   * an iterable of key/value pairs representing string parameter values, or a record of string keys and string values.
   * @param options - Initialization options.
   */
  constructor(
    params:
      | string
      | Iterable<readonly [string, (string | null)?]>
      | Readonly<Record<string, string | null | undefined>>,
    options: ChURIParams.Options<TCharge>,
  );

  constructor(
    params:
      | string
      | Iterable<readonly [string, (string | null)?]>
      | Readonly<Record<string, string | null | undefined>>,
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Charge = ChURIParamsCharge,
    }: Partial<ChURIParams.Options<TCharge>> = {},
  ) {
    this.#Charge = Charge as ChURIParams.CustomOptions<TCharge>['Charge'];
    if (typeof params === 'string') {
      const [entries, rawCharge] = parseChURIParams(params, this, this.#list);

      this.#map = entries;
      this.#rawCharge = rawCharge;
    } else {
      this.#map = provideChURIParams(params, this.#list);
      this.#rawCharge = null;
    }
  }

  /**
   * Search parameters splitter.
   */
  abstract get splitter(): ChURIParamSplitter;

  /**
   * Raw parameter values.
   */
  get raw(): ChURIRawParams {
    return (this.#raw ??= new ChURIParams$Raw(this, this.#rawCharge, this.#list, this.#map));
  }

  /**
   * Parameters charge.
   */
  get charge(): TCharge {
    return (this.#charge ??= new this.#Charge(this as ChURIParams));
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
  forEach(callback: (value: string, key: string, parent: ChURIParams<TCharge>) => void): void {
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
   * @returns The string containing parameters joined with {@link ChURIParams.Splitter#joiner joiner} symbol.
   */
  toString(): string {
    return this.#list.join(this.splitter.joiner);
  }

}

export namespace ChURIParams {
  export type Options<TCharge = ChURIParamsCharge> = ChURIParamsCharge extends TCharge
    ? DefaultOptions
    : CustomOptions<TCharge>;

  export interface DefaultOptions {
    readonly Charge?: (new (params: ChURIParams) => ChURIParamsCharge) | undefined;
  }

  export interface CustomOptions<out TCharge> {
    readonly Charge: new (params: ChURIParams) => TCharge;
  }
}

/**
 * Charged search parameters representing a {@link ChURI#search query string} of the URI.
 *
 * @typeParam TCharge - Parameters charge representation type. {@link ChURIParamsCharge} by default.
 */
export class ChURIQuery<out TCharge = ChURIParamsCharge> extends ChURIParams<TCharge> {

  /**
   * Search parameters splitter.
   *
   * Splits parameters separated by `"&" (U+0026)` symbol.
   */
  get splitter(): ChURIParamSplitter {
    return ChURIQuery$splitter;
  }

}

/**
 * Charged matrix URI parameters representation.
 *
 * In contrast to {@link ChURIQuery search parameters}, uses `";" (U+003B)` as separator.
 *
 * @typeParam TCharge - Parameters charge representation type. {@link ChURIParamsCharge} by default.
 */
export class ChURIMatrix<out TCharge = ChURIParamsCharge> extends ChURIParams<TCharge> {

  /**
   * Matrix parameters splitter.
   *
   * Splits parameters separated by `";" (U+003B)` symbol.
   */
  override get splitter(): ChURIParamSplitter {
    return ChURIMatrix$splitter;
  }

}
