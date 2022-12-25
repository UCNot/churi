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
  export type Placement = Any | Entry | Tail | Arg;

  /**
   * Unknown placement of encoded value.
   */
  export interface Unknown {
    /**
     * Placement role.
     */
    readonly as?: string;

    /**
     * Whether a charge expected to be opaque.
     *
     * Directive arguments are opaque, i.e. it is up to directive how to treat them. Thus, proper string escaping is not
     * needed.
     *
     * Makes sense only for string arguments.
     */
    readonly opaque?: boolean | undefined;

    /**
     * Informs the enclosing encoder that it may omit parentheses around encoded charge.
     */
    readonly omitParentheses?: ((this: void) => void) | undefined;
  }

  /**
   * The encoded value may be used placed as any part of URI charge.
   */
  export interface Any extends Unknown {
    readonly as?: undefined;

    /**
     * Whether a charge expected to be opaque.
     *
     * Directive arguments are opaque, i.e. it is up to directive how to treat them. Thus, proper string escaping is not
     * needed.
     *
     * Makes sense only for string arguments.
     */
    readonly opaque?: boolean | undefined;

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
  export interface Entry extends Unknown {
    readonly as: 'entry';

    readonly opaque?: undefined;

    /**
     * Informs the enclosing map encoder that it may omit parentheses around encoded entry value.
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
  export interface Tail extends Unknown {
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
  export interface Arg extends Unknown {
    readonly as: 'arg';

    /**
     * Informs the enclosing directive encoder that it may omit parentheses around encoded argument(s).
     */
    readonly omitParentheses: (this: void) => void;
  }
}
