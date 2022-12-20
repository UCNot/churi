/**
 * URI-chargeable value has custom encoding within {@link chargeURI URI charge}.
 */
export interface URIChargeable {
  /**
   * Encodes the value placed to URI charge.
   *
   * The encoded value will be appended to URI as is. This means it should be percent-encoded etc.
   *
   * @param placement - The supposed placement of encoded value.
   *
   * @returns String with encoded value, or `undefined` if the value can not be encoded.
   */
  chargeURI?(placement: URIChargeable.Placement): string | undefined;

  /**
   * Represents the value as JSON.
   *
   * This method is called if {@link chargeURI} is absent. The result is encoded then.
   *
   * @returns The value to encode instead.
   */
  toJSON?(): unknown;
}

export namespace URIChargeable {
  /**
   * The supposed placement of encoded value.
   */
  export type Placement = Any | Top | Entry | Tail | Arg;

  /**
   * The encoded value may be used placed as any part of URI charge.
   */
  export interface Any {
    readonly as?: undefined;
    readonly omitParentheses?: undefined;
  }

  /**
   * The encoded value supposed to be placed as top-level value.
   *
   * Normally, a string started with meaningful symbols (e.g. digits) is escaped by APOSTROPHE (U+0027).
   * At the top level, such string is escaped by percent-encoding the first symbol. This preserves string value for
   * users unaware of URI charge format.
   *
   * This hint makes sense only for string values.
   */
  export interface Top {
    readonly as: 'top';
    readonly omitParentheses?: undefined;
  }

  /**
   * The encoded value supposed to be placed as a map entry value after opening parent.
   *
   * This may affect a list. If it has two or more items, the enclosing parentheses may be omitted. So, the
   * ```
   * foo((item1)(item2))
   * ```
   * may be encoded as
   * ```
   * foo(item1)(item2)
   * ```
   */
  export interface Entry {
    readonly as: 'entry';

    /**
     * Informs the enclosing object encoder that it may omit parentheses around encoded entry value.
     */
    readonly omitParentheses: (this: void) => void;
  }

  /**
   * The encoded value supposed to be placed as the last item of a list or last directive argument.
   *
   * This may affect a trailing item of the list containing a map. The enclosing parentheses may be omitted in this
   * case. So, the
   * ```
   * (item1)(item2(foo(bar)))
   * ```
   * may be encoded as
   * ```
   * (item1)(item2)foo(bar)
   * ```
   */
  export interface Tail {
    readonly as: 'tail';

    /**
     * Informs the enclosing list encoder that it may omit parentheses around encoded item value.
     */
    readonly omitParentheses: (this: void) => void;
  }

  /**
   * The encoded value supposed to be placed as a directive argument value after opening parent.
   *
   * This may affect a list. If it has two or more items, the enclosing parentheses may be omitted. So, the
   * ```
   * !foo((arg1)(arg2)arg3(value)suffix)
   * ```
   * may be encoded as
   * ```
   !foo(arg1)(arg2)arg3(value)suffix
   * ```
   */
  export interface Arg {
    readonly as: 'arg';

    /**
     * Informs the enclosing directive encoder that it may omit parentheses around encoded argument(s).
     */
    readonly omitParentheses: (this: void) => void;
  }
}
