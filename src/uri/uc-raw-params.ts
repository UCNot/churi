/**
 * Search parameters representing a {@link UcSearchParams#raw query string} of the URI, containing raw
 * (i.e. _not_ URI-decoded) values.
 *
 * Unlike values, parameter keys _are_ URI-decoded.
 */
export interface UcRawParams extends Iterable<[string, string]> {
  /**
   * Checks whether a parameter with the specified name present.
   *
   * @param name - Target parameter name.
   *
   * @returns `true` if parameter present, or `false` otherwise.
   *
   * @see [URLSearchParams.has()](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/has).
   */
  has(name: string): boolean;

  /**
   * Obtains the first raw (not URI-decoded) value associated to the given search parameter.
   *
   * @param name - Target parameter name.
   *
   * @returns A string if the given search parameter is found; otherwise, `null`.
   */
  get(name: string): string | null;

  /**
   * Obtains all raw (not URI-decoded) values associated with a given search parameter as an array.
   *
   * @param name - Target parameter name.
   *
   * @returns An array of strings. Empty array if parameter absent.
   */
  getAll(name: string): string[];

  /**
   * Iterates over all keys contained in this object. The keys are string objects.
   *
   * @returns An iterable iterator of parameter names in order of their appearance. Note that the same parameter name
   * may be reported multiple times.
   */
  keys(): IterableIterator<string>;

  /**
   * Iterates over all key/value pairs contained in this object. The key and value of each pair are string objects.
   *
   * @returns An iterable iterator of parameter name/value pairs in order of their appearance.
   */
  entries(): IterableIterator<[string, string]>;

  /**
   * Iterates over all values values contained in this object. The values are string objects.
   *
   * @returns An iterable iterator of parameter values in order of their appearance.
   */
  values(): IterableIterator<string>;

  /**
   * Iterates over all values contained in this object via a callback function.
   *
   * @param callback - Function to execute on each element. Accepts parameter name, string parameter value, and `this`
   * instance as arguments.
   */
  forEach(callback: (value: string, key: string, parent: UcRawParams) => void): void;

  /**
   * Iterates over all key/value pairs contained in this object. The key and value of each pair are string objects.
   *
   * The same as {@link entries}.
   *
   * @returns An iterable iterator of parameter name/value pairs in order of their appearance.
   */
  [Symbol.iterator](): IterableIterator<[string, string]>;

  /**
   * Builds a query string.
   *
   * @returns The string containing parameters joined with {@link UcSearchParams.Splitter#joiner joiner} symbol.
   */
  toString(): string;
}
