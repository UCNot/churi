/**
 * Charged URI {@link ChURIParams parameters} splitter.
 */
export interface ChURIParamSplitter {
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
