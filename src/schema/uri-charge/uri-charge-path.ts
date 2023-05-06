/**
 * Charge path navigates through map entries and list items to single value.
 *
 * Consists of one or more fragments.
 */
export type URIChargePath = readonly [URIChargePath.Head, ...URIChargePath.Fragment[]];

export namespace URIChargePath {
  /**
   * Head fragment of the {@link URIChargePath charge path}.
   *
   * May not represent a map entry.
   */
  export interface Head {
    /**
     * Item index within {@link UcList list}.
     *
     * `undefined` for single values.
     *
     * May be either `undefined` or `0` for the first item of the list, depending on how the list specified.
     */
    readonly index?: number | undefined;
  }

  /**
   * Subsequent fragment of the {@link URIChargePath charge path}.
   */
  export interface Fragment {
    /**
     * Item index within {@link UcList list}.
     *
     * `undefined` for single values.
     *
     * May be either `undefined` or `0` for the first item of the list, depending on how the list specified.
     *
     * When {@link key} also present, represents an item within entry value.
     */
    readonly index?: number | undefined;

    /**
     * Entry key within {@link UcMap map}.
     *
     * `undefined` for primitive values.
     */
    readonly key?: PropertyKey | undefined;
  }
}
