import { isIterable } from '@proc7ts/primitives';
import { createURIChargeParser } from './charge/parse-uri-charge.js';
import { URIChargeParser } from './charge/uri-charge-parser.js';
import { URICharge } from './charge/uri-charge.js';
import { decodeSearchParam, encodeSearchParam } from './impl/search-param-codec.js';
import { UcSearchParams$splitter } from './impl/uc-search-params.splitter.js';
import { UcPrimitive } from './schema/uc-primitive.js';

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
 * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
 * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
 */
export class UcSearchParams<out TValue = UcPrimitive, out TCharge = URICharge<TValue>>
  implements Iterable<[string, string]> {

  readonly #chargeParser: URIChargeParser<TValue, TCharge>;
  readonly #list: ChSearchParamValue[] = [];
  readonly #map: Map<string, ChSearchParam<TValue, TCharge>>;
  #charge?: TCharge;

  /**
   * Constructs search parameters.
   *
   * @param search - Either a string containing parameters to parse (a leading `"?" (U+OO3F)"` character is ignored),
   * an iterable of key/value pairs representing string parameter values, or a record of string keys and string values.
   * @param chargeParser - Parser to use to parse parameter {@link chargeOf charges}.
   */
  constructor(
    search:
      | string
      | Iterable<readonly [string, (string | null)?]>
      | Readonly<Record<string, string | null | undefined>>,
    ...chargeParser: UcPrimitive extends TValue
      ? URICharge<TValue> extends TCharge
        ? [URIChargeParser<TValue, TCharge>?]
        : [URIChargeParser<TValue, TCharge>]
      : [URIChargeParser<TValue, TCharge>]
  );

  constructor(
    search:
      | string
      | Iterable<readonly [string, (string | null)?]>
      | Readonly<Record<string, string | null | undefined>>,
    chargeParser: URIChargeParser<
      TValue,
      TCharge
    > = /*#__PURE__*/ createURIChargeParser() as URIChargeParser<TValue, TCharge>,
  ) {
    this.#chargeParser = chargeParser;
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
   * Parser used to parse parameter {@link chargeOf charges}.
   */
  get chargeParser(): URIChargeParser<TValue, TCharge> {
    return this.#chargeParser;
  }

  #parse(search: string): Map<string, ChSearchParam<TValue, TCharge>> {
    if (search.startsWith('?')) {
      search = search.slice(1);
    }

    const entries = new Map<string, ChSearchParam$Parsed<TValue, TCharge>>();

    if (!search) {
      return entries;
    }

    for (const [rawKey, rawValue] of this.splitter.split(search)) {
      const key = decodeSearchParam(rawKey);
      const prev = entries.get(key);

      if (prev) {
        this.#list.push(prev.add(rawValue));
      } else {
        const param = new ChSearchParam$Parsed<TValue, TCharge>(key, rawKey, rawValue);

        entries.set(key, param);
        this.#list.push(new ChSearchParamValue(param, 0));
      }
    }

    return entries;
  }

  #provide(
    search: Iterable<readonly [string, (string | null)?]>,
  ): Map<string, ChSearchParam<TValue, TCharge>> {
    const entries = new Map<string, ChSearchParam$Provided<TValue, TCharge>>();

    for (const [key, val] of search) {
      const value = val ? String(val) : '';
      const prev = entries.get(key);

      if (prev) {
        this.#list.push(prev.add(value));
      } else {
        const param = new ChSearchParam$Provided<TValue, TCharge>(key, value);

        entries.set(key, param);
        this.#list.push(new ChSearchParamValue(param, 0));
      }
    }

    return entries;
  }

  /**
   * Combined charge representing all parameters.
   *
   * This is a {@link URICharge#isMap charge map} with parameter names as keys and their {@link chargeOf charges} as
   * values.
   */
  get charge(): TCharge {
    return this.#charge !== undefined ? this.#charge : (this.#charge = this.#parseCharge());
  }

  #parseCharge(): TCharge {
    const { chargeParser } = this;

    return chargeParser.chargeRx.rxMap(rx => {
      for (const entry of this.#map.values()) {
        rx.rxEntry(entry.key, rx => {
          rx.add(entry.getCharge(chargeParser));

          return rx.end();
        });
      }

      return rx.endMap();
    });
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
   * Parses and obtains the named parameter charge.
   *
   * If parameter has {@link getAll multiple values}, the returned value will be a {@link URICharge#isList charge list}.
   *
   * @param name - Target parameter name.
   *
   * @returns Parameter value parsed as URI charge, or {@link URIChargeRx#none none} if parameter absent.
   */
  chargeOf(name: string): TCharge {
    const entry = this.#map.get(name);

    return entry ? entry.getCharge(this.chargeParser) : this.chargeParser.chargeRx.none;
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
  forEach(
    callback: (value: string, key: string, parent: UcSearchParams<TValue, TCharge>) => void,
  ): void {
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

class ChSearchParamValue {

  readonly #param: ChSearchParam<unknown, unknown>;
  readonly #index: number;

  constructor(param: ChSearchParam<unknown, unknown>, index: number) {
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

abstract class ChSearchParam<out TValue, out TCharge> {

  #charge?: TCharge;

  abstract readonly key: string;
  abstract readonly rawKey: string;
  abstract readonly values: string[];
  abstract readonly rawValues: string[];

  getCharge(parser: URIChargeParser<TValue, TCharge>): TCharge {
    return this.#charge !== undefined ? this.#charge : (this.#charge = this.parseCharge(parser));
  }

  protected abstract parseCharge(parser: URIChargeParser<TValue, TCharge>): TCharge;

}

class ChSearchParam$Parsed<out TValue, out TCharge> extends ChSearchParam<TValue, TCharge> {

  readonly #key: string;
  readonly #rawKey: string;
  readonly #rawValues: string[];

  #values?: string[];

  constructor(key: string, rawKey: string, rawValue: string) {
    super();
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

  protected override parseCharge(parser: URIChargeParser<TValue, TCharge>): TCharge {
    const rawValues = this.#rawValues;

    return rawValues.length === 1
      ? parser.parse(rawValues[0]).charge
      : this.#parseList(parser, rawValues);
  }

  #parseList(parser: URIChargeParser<TValue, TCharge>, rawValues: string[]): TCharge {
    const { chargeRx } = parser;

    return chargeRx.rxList(listRx => {
      for (const rawValue of rawValues) {
        listRx.add(chargeRx.rxValue(itemRx => parser.parse(rawValue, itemRx).charge));
      }

      return listRx.end();
    });
  }

}

class ChSearchParam$Provided<out TValue, out TCharge> extends ChSearchParam<TValue, TCharge> {

  readonly #key: string;
  readonly #values: string[];

  #rawKey?: string;
  #rawValues?: string[];

  constructor(key: string, value: string) {
    super();
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

  protected override parseCharge(parser: URIChargeParser<TValue, TCharge>): TCharge {
    const values = this.#values;

    return values.length === 1
      ? parser.chargeRx.createValue(values[0], 'string')
      : this.#parseList(parser, values);
  }

  #parseList(parser: URIChargeParser<TValue, TCharge>, values: string[]): TCharge {
    const { chargeRx } = parser;

    return chargeRx.rxList(listRx => {
      for (const value of values) {
        listRx.addValue(value, 'string');
      }

      return listRx.end();
    });
  }

}
