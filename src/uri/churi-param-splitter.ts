/**
 * Charged URI {@link ChURIParams parameters} splitter.
 */
export interface ChURIParamSplitter {
  /**
   * Prefix symbol.
   *
   * E.g. `?` for query, `;` for matrix, or `#` for hash.
   */
  readonly prefix: string;

  /**
   * Symbol used to join search parameters.
   *
   * @defaultValue `"&" (U+0026)`
   */
  readonly joiner: string;

  /**
   * Splits parameters string onto key/value pairs.
   *
   * By default, splits `&`-separated
   *
   * @param params - Parameters string to split.
   *
   * @returns Iterable of URI-encoded key/value pairs. A value can be `null` when absent, e.g. when _equals sign_
   * is missing.
   */
  split(params: string): Iterable<readonly [string, string | null]>;
}
