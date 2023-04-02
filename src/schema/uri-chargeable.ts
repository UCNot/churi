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
  export type Placement = Any | Item;

  /**
   * The encoded value may be used placed as any part of URI charge.
   */
  export interface Any {
    readonly as?: undefined;

    readonly omitCommaBefore?: undefined;

    readonly omitCommaAfter?: undefined;
  }

  /**
   * The encoded value supposed to be placed as a list item value.
   *
   * **Nested lists have to enclose themselves into parentheses** when placed as nested list items.
   *
   * Omitting commas is applicable to nested lists, so that:
   * ```
   * foo((item-1.1,item-1.2),(item-2.1,item-2.2))
   * ```
   * may be encoded as
   * ```
   * foo((item-1.1,item-1.2)(item-2.1,item-2.2))
   * ```
   */
  export interface Item {
    readonly as: 'item';

    /**
     * Allows the enclosing list encoder to omit comma before this item if the preceding item
     * {@link omitCommaAfter allows this too} .
     */
    readonly omitCommaBefore: (this: void) => void;

    /**
     * Allows the enclosing list encoder to omit comma after this item if the following item
     * {@link omitCommaBefore allows this too}.
     */
    readonly omitCommaAfter: (this: void) => void;
  }
}
