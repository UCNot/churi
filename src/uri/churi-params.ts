import { parseURICharge } from '#churi/uri-charge/deserializer';
import { URICharge$List } from '../schema/uri-charge/impl/uri-charge.some.js';
import { URICharge } from '../schema/uri-charge/uri-charge.js';
import {
  ChURIAnchor$splitter,
  ChURIMatrix$splitter,
  ChURIQuery$splitter,
} from './churi-param-splitter.impl.js';
import { ChURIParamSplitter } from './churi-param-splitter.js';
import {
  ChURIParam,
  ChURIParamValue,
  parseChURIParams,
  provideChURIParams,
} from './churi-param.impl.js';

/**
 * Abstract parameters of {@link ChURI charged URI}. A base class for {@link ChURIQuery search parameters},
 * {@link ChURIMatrix matrix parameters}, and {@link ChURIAnchor hash parameters}.
 *
 * Resembles standard [URLSearchParams class] in its read-only part.
 *
 * [URLSearchParams class]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
 *
 * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
 */
export abstract class ChURIParams<out TCharge = URICharge> implements Iterable<[string, string]> {

  /**
   * Search parameters splitter.
   *
   * Splits parameters separated by `"&" (U+0026)` symbol by default.
   */
  static get splitter(): ChURIParamSplitter {
    return ChURIQuery$splitter;
  }

  readonly #list: ChURIParamValue[] = [];
  readonly #map: Map<string, ChURIParam>;
  readonly #rawArg: string | null;
  readonly #parser: ChURIParams.Parser<TCharge>;

  readonly #charges = new Map<string, TCharge>();
  #arg: TCharge | typeof ChURIParams$NoArg = ChURIParams$NoArg;

  /**
   * Constructs search parameters.
   *
   * @param params - Either a string containing parameters to parse (a {@link ChURIParamSplitter#prefix prefix}
   * symbol is ignored), an iterable of key/value pairs representing string parameter values, or a record of string
   * keys and string values.
   * @param parser - Parser of parameter charges.
   */
  constructor(
    params:
      | string
      | Iterable<readonly [string, (string | null)?]>
      | Readonly<Record<string, string | null | undefined>>,
    parser = ChURIParams$parse as ChURIParams.Parser<TCharge>,
  ) {
    this.#parser = parser;

    if (typeof params === 'string') {
      const [entries, rawCharge] = parseChURIParams(params, new.target.splitter, this.#list);

      this.#map = entries;
      this.#rawArg = rawCharge;
    } else {
      this.#map = provideChURIParams(params, this.#list);
      this.#rawArg = null;
    }
  }

  /**
   * Obtains positional argument.
   *
   * The very first parameter is treated as positional argument unless it contains an _equals sign_ (`= (U+003D)`),
   * i.e. the first _named_ parameter name and value.
   */
  get arg(): TCharge {
    if (this.#arg === ChURIParams$NoArg) {
      this.#arg = this.#parser(this.#rawArg == null ? [] : [this.#rawArg], null, this);
    }

    return this.#arg as TCharge;
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
   * Obtains a charge of the named parameter.
   *
   * @param name - Target parameter name.
   *
   * @returns Parameter charge.
   */
  getCharge(name: string): TCharge {
    if (this.#charges.has(name)) {
      return this.#charges.get(name) as TCharge;
    }

    const rawValues = this.#map.get(name)?.rawValues ?? [];
    const charge = this.#parser(rawValues, name, this);

    this.#charges.set(name, charge);

    return charge;
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
   * @returns The string containing parameters joined with {@link ChURIParamSplitter#joiner joiner} symbol.
   */
  toString(): string {
    return this.#list.join((this.constructor as typeof ChURIParams<TCharge>).splitter.joiner);
  }

}

export namespace ChURIParams {
  /**
   * Parser of URI search parameter charges.
   *
   * Builds parameter charge by raw parameter values.
   *
   * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
   * @param rawValues - Array of raw parameter values as they present in URI (i.e. not URI-decoded). Empty for absent
   * parameter.
   * @param name - Target parameter name, or `null` to parse {@link ChURIParams#arg positional argument}.
   * @param params - URI search parameters instance.
   *
   * @returns Parameter charge.
   */
  export type Parser<out TCharge = URICharge> = {
    parseParams(
      this: void,
      rawValues: string[],
      name: string | null,
      params: ChURIParams<TCharge>,
    ): TCharge;
  }['parseParams'];
}

/**
 * Anchor parameters representing a {@link ChURI#hash hash (fragment part)} of URI.
 *
 * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
 */
export class ChURIAnchor<out TCharge = URICharge> extends ChURIParams<TCharge> {

  /**
   * Anchor parameters splitter.
   *
   * Splits parameters separated by `"&" (U+0026)` symbol.
   */
  static override get splitter(): ChURIParamSplitter {
    return ChURIAnchor$splitter;
  }

}

/**
 * Authentication info representing a {@link ChURI#username username} part of URI, possibly with Matrix-like parameters
 * separated by _semicolons_ `";" (U+003B)`.
 *
 * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
 */
export class ChURIAuth<out TCharge = URICharge> extends ChURIParams<TCharge> {

  /**
   * Matrix parameters splitter.
   *
   * Splits parameters separated by `";" (U+003B)` symbol.
   */
  static override get splitter(): ChURIParamSplitter {
    return ChURIMatrix$splitter;
  }

}

/**
 * Charged search parameters representing a {@link ChURI#search query string} of the URI.
 *
 * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
 */
export class ChURIQuery<out TCharge = URICharge> extends ChURIParams<TCharge> {}

/**
 * Charged matrix URI parameters representation.
 *
 * In contrast to {@link ChURIQuery search parameters}, uses `";" (U+003B)` as separator.
 *
 * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
 */
export class ChURIMatrix<out TCharge = URICharge> extends ChURIParams<TCharge> {

  /**
   * Matrix parameters splitter.
   *
   * Splits parameters separated by `";" (U+003B)` symbol.
   */
  static override get splitter(): ChURIParamSplitter {
    return ChURIMatrix$splitter;
  }

}

function ChURIParams$parse(rawValues: string[], _key: string | null, _params: ChURIParams): any {
  if (rawValues.length < 2) {
    return rawValues.length ? parseURICharge(rawValues[0]) : URICharge.none;
  }

  return new URICharge$List(
    rawValues
      .map(rawValue => parseURICharge(rawValue))
      .filter<URICharge.Some>((charge: URICharge): charge is URICharge.Some => charge.isSome()),
  );
}

const ChURIParams$NoArg = {};
